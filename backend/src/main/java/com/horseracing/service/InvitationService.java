package com.horseracing.backend.service;

import com.horseracing.backend.dto.RaceInvitationDTO;
import com.horseracing.backend.entity.Horse;
import com.horseracing.backend.entity.RaceEntry;
import com.horseracing.backend.entity.RaceInvitation;
import com.horseracing.backend.entity.User;
import com.horseracing.backend.mapper.RaceInvitationMapper;
import com.horseracing.backend.repository.HorseRepository;
import com.horseracing.backend.repository.RaceEntryRepository;
import com.horseracing.backend.repository.RaceInvitationRepository;
import com.horseracing.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class InvitationService {

    private final RaceInvitationRepository invitationRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final UserRepository userRepository;
    private final HorseRepository horseRepository;
    private final RaceInvitationMapper invitationMapper;

    public List<RaceInvitationDTO> getInvitations(Integer jockeyId, Integer ownerId) {
        List<RaceInvitation> invitations;
        if (jockeyId != null) {
            invitations = invitationRepository.findByJockeyId(jockeyId);
        } else if (ownerId != null) {
            invitations = invitationRepository.findByOwnerId(ownerId);
        } else {
            invitations = invitationRepository.findAll();
        }

        Map<Integer, String> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));
        Map<Integer, String> horseMap = horseRepository.findAll().stream()
                .collect(Collectors.toMap(Horse::getId, Horse::getName));

        return invitations.stream()
                .map(i -> invitationMapper.toDTO(i, 
                        horseMap.get(i.getHorseId()), 
                        userMap.get(i.getOwnerId()), 
                        userMap.get(i.getJockeyId())))
                .collect(Collectors.toList());
    }

    @Transactional
    public RaceInvitationDTO inviteJockey(RaceInvitationDTO dto) {
        Integer jockeyId = dto.getJockeyId();
        Integer raceId = dto.getRaceId();
        Integer horseId = dto.getHorseId();

        // 1. Kiểm tra xem jockey đã bận chưa (đã có lượt tham gia hoạt động trong trận đua này)
        List<RaceEntry> activeEntries = raceEntryRepository.findByRaceId(raceId);
        boolean isBooked = activeEntries.stream()
                .anyMatch(e -> e.getJockeyId().equals(jockeyId) && !"REJECTED".equals(e.getStatus()));
        if (isBooked) {
            throw new IllegalArgumentException("This jockey has already accepted a mount for this race.");
        }

        // 2. Kiểm tra xem jockey đã chấp nhận lời mời nào khác trong trận đua này chưa
        List<RaceInvitation> accepted = invitationRepository.findByJockeyIdAndRaceIdAndStatus(jockeyId, raceId, "ACCEPTED");
        if (!accepted.isEmpty()) {
            throw new IllegalArgumentException("This jockey has already accepted an invitation for this race.");
        }

        // 3. Kiểm tra xem chủ ngựa đã gửi lời mời đang chờ nào cho jockey này trong trận đua này chưa
        List<RaceInvitation> existingPending = invitationRepository.findByJockeyIdAndRaceIdAndStatus(jockeyId, raceId, "PENDING");
        boolean hasPendingForHorse = existingPending.stream().anyMatch(i -> i.getHorseId().equals(horseId));
        if (hasPendingForHorse) {
            throw new IllegalArgumentException("You have already sent a pending invitation to this jockey for this horse in this race.");
        }

        RaceInvitation invite = invitationMapper.toEntity(dto);
        invite.setStatus("PENDING");
        RaceInvitation savedInvite = invitationRepository.save(invite);

        Map<Integer, String> userMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, User::getUsername));
        String horseName = horseRepository.findById(savedInvite.getHorseId())
                .map(Horse::getName)
                .orElse(null);

        return invitationMapper.toDTO(savedInvite, 
                horseName, 
                userMap.get(savedInvite.getOwnerId()), 
                userMap.get(savedInvite.getJockeyId()));
    }

    @Transactional
    public void acceptInvitation(Integer id) {
        RaceInvitation invite = invitationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        if (!"PENDING".equals(invite.getStatus())) {
            throw new IllegalArgumentException("Invitation is not pending");
        }

        // Kiểm tra xem jockey đã có mount nào hoạt động chưa
        List<RaceEntry> activeEntries = raceEntryRepository.findByRaceId(invite.getRaceId());
        boolean isBooked = activeEntries.stream()
                .anyMatch(e -> e.getJockeyId().equals(invite.getJockeyId()) && !"REJECTED".equals(e.getStatus()));
        if (isBooked) {
            throw new IllegalArgumentException("You already have an active mount in this race.");
        }

        // Kiểm tra xem ngựa đã có lượt tham gia hoạt động chưa
        boolean isHorseBooked = activeEntries.stream()
                .anyMatch(e -> e.getHorseId().equals(invite.getHorseId()) && !"REJECTED".equals(e.getStatus()));
        if (isHorseBooked) {
            throw new IllegalArgumentException("This horse already has an active entry in this race.");
        }

        // Tạo RaceEntry chính thức
        Optional<User> jockeyOpt = userRepository.findById(invite.getJockeyId());
        BigDecimal weight = jockeyOpt.isPresent() && jockeyOpt.get().getWeight() != null ? jockeyOpt.get().getWeight() : BigDecimal.ZERO;

        RaceEntry entry = new RaceEntry();
        entry.setRaceId(invite.getRaceId());
        entry.setHorseId(invite.getHorseId());
        entry.setJockeyId(invite.getJockeyId());
        entry.setGateNumber(0); // Admin sẽ gán sau
        entry.setStatus("PENDING_ADMIN");
        entry.setCarriedWeight(weight);
        entry.setPrizeMoney(BigDecimal.ZERO);
        entry.setRatingAdjustment(0);
        entry.setHandicapWeight(BigDecimal.ZERO);

        raceEntryRepository.save(entry);

        // Cập nhật trạng thái lời mời
        invite.setStatus("ACCEPTED");
        invitationRepository.save(invite);

        // Từ chối tất cả các lời mời đang chờ/đã chấp nhận khác cho ngựa hoặc jockey này trong trận đua này
        List<RaceInvitation> allInvites = invitationRepository.findByRaceId(invite.getRaceId());
        for (RaceInvitation other : allInvites) {
            if (!other.getId().equals(invite.getId())) {
                if ("PENDING".equals(other.getStatus()) || "ACCEPTED".equals(other.getStatus())) {
                    if (other.getHorseId().equals(invite.getHorseId()) || other.getJockeyId().equals(invite.getJockeyId())) {
                        other.setStatus("REJECTED");
                        invitationRepository.save(other);
                    }
                }
            }
        }
    }

    @Transactional
    public void rejectInvitation(Integer id) {
        RaceInvitation invite = invitationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));
        invite.setStatus("REJECTED");
        invitationRepository.save(invite);
    }
}
