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
import com.horseracing.backend.repository.RaceRepository;
import com.horseracing.backend.repository.RaceMeetingRepository;
import com.horseracing.backend.repository.JockeyRaceMeetingRegistrationRepository;
import com.horseracing.backend.repository.HorseRaceMeetingRegistrationRepository;
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
    private final RaceRepository raceRepository;
    private final RaceMeetingRepository raceMeetingRepository;
    private final RaceInvitationMapper invitationMapper;
    private final JockeyRaceMeetingRegistrationRepository jockeyRegRepository;
    private final HorseRaceMeetingRegistrationRepository horseRegRepository;

    public List<RaceInvitationDTO> getInvitations(Integer jockeyId, Integer ownerId) {
        List<RaceInvitation> invitations;
        if (jockeyId != null) {
            invitations = invitationRepository.findByJockeyId(jockeyId);
        } else if (ownerId != null) {
            invitations = invitationRepository.findByOwnerId(ownerId);
        } else {
            invitations = invitationRepository.findAll();
        }

        Map<Integer, User> userEntityMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (u1, u2) -> u1));
        Map<Integer, Horse> horseEntityMap = horseRepository.findAll().stream()
                .collect(Collectors.toMap(Horse::getId, h -> h, (h1, h2) -> h1));

        java.util.Map<Integer, com.horseracing.backend.entity.Race> raceMap = raceRepository.findAll().stream()
                .collect(Collectors.toMap(com.horseracing.backend.entity.Race::getId, r -> r));
        java.util.Map<Integer, com.horseracing.backend.entity.RaceMeeting> meetingMap = raceMeetingRepository.findAll().stream()
                .collect(Collectors.toMap(com.horseracing.backend.entity.RaceMeeting::getId, m -> m));

        java.util.List<RaceEntry> allEntries = raceEntryRepository.findAll();

        return invitations.stream()
                .map(i -> {
                    Horse horse = horseEntityMap.get(i.getHorseId());
                    User owner = userEntityMap.get(i.getOwnerId());
                    User jockey = userEntityMap.get(i.getJockeyId());

                    String horseName = horse != null ? horse.getName() : null;
                    String horseAvatar = horse != null ? horse.getAvatar() : null;
                    String ownerName = owner != null ? (owner.getFullName() != null && !owner.getFullName().isBlank() ? owner.getFullName() : owner.getUsername()) : null;
                    String ownerAvatar = owner != null ? owner.getAvatar() : null;
                    String jockeyName = jockey != null ? (jockey.getFullName() != null && !jockey.getFullName().isBlank() ? jockey.getFullName() : jockey.getUsername()) : null;
                    String jockeyAvatar = jockey != null ? jockey.getAvatar() : null;

                    RaceInvitationDTO dto = invitationMapper.toDTO(i, 
                            horseName, horseAvatar,
                            ownerName, ownerAvatar,
                            jockeyName, jockeyAvatar);
                    
                    com.horseracing.backend.entity.Race race = raceMap.get(i.getRaceId());
                    if (race != null) {
                        dto.setClassLevel(race.getClassLevel());
                        dto.setStartTime(race.getStartTime() != null ? new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(race.getStartTime()) : null);
                        com.horseracing.backend.entity.RaceMeeting meeting = meetingMap.get(race.getRaceMeetingId());
                        if (meeting != null) {
                            dto.setMeetingName(meeting.getName());
                            dto.setVenue(meeting.getVenue());
                        }
                    }

                    // Match with a RaceEntry
                    Optional<RaceEntry> matchingEntry = allEntries.stream()
                            .filter(e -> e.getRaceId().equals(i.getRaceId()) 
                                      && e.getHorseId().equals(i.getHorseId()) 
                                      && e.getJockeyId().equals(i.getJockeyId()))
                            .findFirst();
                    if (matchingEntry.isPresent()) {
                        dto.setEntryId(matchingEntry.get().getId());
                        dto.setEntryStatus(matchingEntry.get().getStatus());
                    }
                    
                    return dto;
                })
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

        // 3. Kiểm tra xem chủ ngựa đã gửi lời mời đang chờ hoặc đã chấp nhận nào cho jockey này đối với con ngựa này chưa
        List<RaceInvitation> existingInvites = invitationRepository.findByJockeyIdAndRaceIdAndHorseId(jockeyId, raceId, horseId);
        boolean hasActive = existingInvites.stream()
                .anyMatch(i -> "PENDING".equalsIgnoreCase(i.getStatus()) || "ACCEPTED".equalsIgnoreCase(i.getStatus()));
        if (hasActive) {
            throw new IllegalArgumentException("You have already sent an active invitation for this horse to this jockey in this race.");
        }

        // 4. Kiểm tra nài ngựa có đăng ký buổi đua này và đã được duyệt hay chưa
        com.horseracing.backend.entity.Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));
        Integer meetingId = race.getRaceMeetingId();

        jockeyRegRepository.findByRaceMeetingIdAndJockeyId(meetingId, jockeyId)
                .filter(reg -> "APPROVED".equalsIgnoreCase(reg.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("JOCKEY_NOT_APPROVED"));

        // 5. Kiểm tra chiến mã có được kích hoạt (ACTIVE) hay chưa
        Horse horse = horseRepository.findById(horseId)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        if (!"ACTIVE".equalsIgnoreCase(horse.getStatus())) {
            throw new IllegalArgumentException("HORSE_NOT_ACTIVE");
        }

        // 6. Kiểm tra chiến mã có đăng ký buổi đua này và đã được duyệt hay chưa
        horseRegRepository.findByRaceMeetingIdAndHorseId(meetingId, horseId)
                .filter(reg -> "APPROVED".equalsIgnoreCase(reg.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("HORSE_NOT_APPROVED"));

        RaceInvitation invite = invitationMapper.toEntity(dto);
        invite.setStatus("PENDING");
        RaceInvitation savedInvite = invitationRepository.save(invite);

        Map<Integer, User> userEntityMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (u1, u2) -> u1));
        Horse horse = horseRepository.findById(savedInvite.getHorseId()).orElse(null);
        User owner = userEntityMap.get(savedInvite.getOwnerId());
        User jockey = userEntityMap.get(savedInvite.getJockeyId());

        String horseName = horse != null ? horse.getName() : null;
        String horseAvatar = horse != null ? horse.getAvatar() : null;
        String ownerName = owner != null ? (owner.getFullName() != null && !owner.getFullName().isBlank() ? owner.getFullName() : owner.getUsername()) : null;
        String ownerAvatar = owner != null ? owner.getAvatar() : null;
        String jockeyName = jockey != null ? (jockey.getFullName() != null && !jockey.getFullName().isBlank() ? jockey.getFullName() : jockey.getUsername()) : null;
        String jockeyAvatar = jockey != null ? jockey.getAvatar() : null;

        return invitationMapper.toDTO(savedInvite, 
                horseName, horseAvatar,
                ownerName, ownerAvatar,
                jockeyName, jockeyAvatar);
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
    public void resubmitRaceEntry(Integer entryId) {
        RaceEntry entry = raceEntryRepository.findById(entryId)
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found"));
        if (!"REJECTED".equalsIgnoreCase(entry.getStatus())) {
            throw new IllegalArgumentException("Only rejected entries can be resubmitted");
        }

        com.horseracing.backend.entity.Race race = raceRepository.findById(entry.getRaceId())
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        if (!"DECLARATION_OPEN".equalsIgnoreCase(race.getStatus())) {
            throw new IllegalStateException("REGISTRATION_CLOSED");
        }

        java.sql.Timestamp now = new java.sql.Timestamp(System.currentTimeMillis());
        if (race.getRegistrationStartTime() != null && now.before(race.getRegistrationStartTime())) {
            throw new IllegalStateException("REGISTRATION_NOT_STARTED");
        }
        if (race.getRegistrationEndTime() != null && now.after(race.getRegistrationEndTime())) {
            throw new IllegalStateException("REGISTRATION_CLOSED");
        }

        // Kiểm tra xem nài ngựa đã bận lượt đăng ký nào khác hoạt động trong trận đấu này chưa
        List<RaceEntry> activeEntries = raceEntryRepository.findByRaceId(entry.getRaceId());
        boolean isJockeyBooked = activeEntries.stream()
                .anyMatch(e -> !e.getId().equals(entryId) && e.getJockeyId().equals(entry.getJockeyId()) && !"REJECTED".equalsIgnoreCase(e.getStatus()));
        if (isJockeyBooked) {
            throw new IllegalStateException("JOCKEY_ALREADY_BOOKED");
        }

        // Kiểm tra xem chiến mã đã bận lượt đăng ký nào khác hoạt động trong trận đấu này chưa
        boolean isHorseBooked = activeEntries.stream()
                .anyMatch(e -> !e.getId().equals(entryId) && e.getHorseId().equals(entry.getHorseId()) && !"REJECTED".equalsIgnoreCase(e.getStatus()));
        if (isHorseBooked) {
            throw new IllegalStateException("HORSE_ALREADY_BOOKED");
        }

        entry.setStatus("PENDING_ADMIN");
        raceEntryRepository.save(entry);

        // Đặt trạng thái lời mời tương ứng trở lại thành ACCEPTED để đồng bộ dữ liệu
        invitationRepository.findByJockeyIdAndRaceIdAndHorseId(entry.getJockeyId(), entry.getRaceId(), entry.getHorseId())
                .stream()
                .filter(i -> "REJECTED".equalsIgnoreCase(i.getStatus()))
                .forEach(i -> {
                    i.setStatus("ACCEPTED");
                    invitationRepository.save(i);

                    // Từ chối tất cả các lời mời đang chờ/đã chấp nhận khác cho ngựa hoặc nài ngựa này trong trận đua này
                    List<RaceInvitation> allInvites = invitationRepository.findByRaceId(i.getRaceId());
                    for (RaceInvitation other : allInvites) {
                        if (!other.getId().equals(i.getId())) {
                            if ("PENDING".equals(other.getStatus()) || "ACCEPTED".equals(other.getStatus())) {
                                if (other.getHorseId().equals(i.getHorseId()) || other.getJockeyId().equals(i.getJockeyId())) {
                                    other.setStatus("REJECTED");
                                    invitationRepository.save(other);
                                }
                            }
                        }
                    }
                });
    }

    @Transactional
    public void rejectInvitation(Integer id) {
        RaceInvitation invite = invitationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));
        invite.setStatus("REJECTED");
        invitationRepository.save(invite);
    }

    @Transactional
    public void withdrawInvitation(Integer id, Integer ownerId) {
        RaceInvitation invite = invitationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));
        if (!invite.getOwnerId().equals(ownerId)) {
            throw new IllegalArgumentException("You do not own this invitation");
        }

        com.horseracing.backend.entity.Race race = raceRepository.findById(invite.getRaceId())
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        if (!"DECLARATION_OPEN".equalsIgnoreCase(race.getStatus())) {
            throw new IllegalStateException("REGISTRATION_CLOSED");
        }

        java.sql.Timestamp now = new java.sql.Timestamp(System.currentTimeMillis());
        if (race.getRegistrationEndTime() != null && now.after(race.getRegistrationEndTime())) {
            throw new IllegalStateException("REGISTRATION_CLOSED");
        }

        // If invitation has been accepted and has a corresponding entry, delete the entry
        if ("ACCEPTED".equalsIgnoreCase(invite.getStatus())) {
            List<RaceEntry> entries = raceEntryRepository.findByRaceId(invite.getRaceId());
            Optional<RaceEntry> entryOpt = entries.stream()
                    .filter(e -> e.getHorseId().equals(invite.getHorseId()) && e.getJockeyId().equals(invite.getJockeyId()))
                    .findFirst();
            if (entryOpt.isPresent()) {
                raceEntryRepository.delete(entryOpt.get());
            }
        }

        invite.setStatus("REJECTED");
        invitationRepository.save(invite);
    }
}
