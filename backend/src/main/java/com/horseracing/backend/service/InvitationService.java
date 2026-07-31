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
    private final NotificationService notificationService;

    // Lấy danh sách lời mời thi đấu lọc theo Nài ngựa (Jockey) hoặc Chủ sở hữu (Owner)
    public List<RaceInvitationDTO> getInvitations(Integer jockeyId, Integer ownerId) {
        List<RaceInvitation> invitations; // Danh sách các bản ghi lời mời
        if (jockeyId != null) {
            invitations = invitationRepository.findByJockeyId(jockeyId); // Lọc lời mời theo Nài ngựa
        } else if (ownerId != null) {
            invitations = invitationRepository.findByOwnerId(ownerId); // Lọc lời mời theo Chủ sở hữu
        } else {
            invitations = invitationRepository.findAll(); // Lấy tất cả lời mời
        }

        // Tải trước danh sách người dùng vào Map để tra cứu thông tin nài/chủ nhanh chóng
        Map<Integer, User> userEntityMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (u1, u2) -> u1));
        // Tải trước danh sách chiến mã vào Map
        Map<Integer, Horse> horseEntityMap = horseRepository.findAll().stream()
                .collect(Collectors.toMap(Horse::getId, h -> h, (h1, h2) -> h1));

        // Tải trước danh sách Trận đua và Ngày hội đua vào Map
        java.util.Map<Integer, com.horseracing.backend.entity.Race> raceMap = raceRepository.findAll().stream()
                .collect(Collectors.toMap(com.horseracing.backend.entity.Race::getId, r -> r));
        java.util.Map<Integer, com.horseracing.backend.entity.RaceMeeting> meetingMap = raceMeetingRepository.findAll().stream()
                .collect(Collectors.toMap(com.horseracing.backend.entity.RaceMeeting::getId, m -> m));

        java.util.List<RaceEntry> allEntries = raceEntryRepository.findAll(); // Lấy danh sách lượt thi đấu

        // Chuyển đổi từng bản ghi lời mời sang DTO kèm thông tin đính kèm
        return invitations.stream()
                .map(i -> {
                    Horse horse = horseEntityMap.get(i.getHorseId()); // Lấy thông tin con ngựa
                    User owner = userEntityMap.get(i.getOwnerId()); // Lấy thông tin chủ sở hữu
                    User jockey = userEntityMap.get(i.getJockeyId()); // Lấy thông tin nài ngựa

                    String horseName = horse != null ? horse.getName() : null; // Tên ngựa
                    String horseAvatar = horse != null ? horse.getAvatar() : null; // Ảnh ngựa
                    String ownerName = owner != null ? (owner.getFullName() != null && !owner.getFullName().isBlank() ? owner.getFullName() : owner.getUsername()) : null; // Tên chủ
                    String ownerAvatar = owner != null ? owner.getAvatar() : null; // Ảnh chủ
                    String jockeyName = jockey != null ? (jockey.getFullName() != null && !jockey.getFullName().isBlank() ? jockey.getFullName() : jockey.getUsername()) : null; // Tên nài
                    String jockeyAvatar = jockey != null ? jockey.getAvatar() : null; // Ảnh nài

                    // Ánh xạ sang RaceInvitationDTO
                    RaceInvitationDTO dto = invitationMapper.toDTO(i, 
                            horseName, horseAvatar,
                            ownerName, ownerAvatar,
                            jockeyName, jockeyAvatar);
                    
                    com.horseracing.backend.entity.Race race = raceMap.get(i.getRaceId()); // Trận đua tương ứng
                    if (race != null) {
                        dto.setClassLevel(race.getClassLevel()); // Hạng đua
                        dto.setStartTime(race.getStartTime() != null ? new java.text.SimpleDateFormat("dd/MM/yyyy HH:mm").format(race.getStartTime()) : null); // Giờ đua
                        com.horseracing.backend.entity.RaceMeeting meeting = meetingMap.get(race.getRaceMeetingId());
                        if (meeting != null) {
                            dto.setMeetingName(meeting.getName()); // Tên ngày hội đua
                            dto.setVenue(meeting.getVenue()); // Địa điểm đua
                        }
                    }

                    // Khớp lời mời với bản ghi RaceEntry thi đấu chính thức nếu có
                    Optional<RaceEntry> matchingEntry = allEntries.stream()
                            .filter(e -> e.getRaceId().equals(i.getRaceId()) 
                                      && e.getHorseId().equals(i.getHorseId()) 
                                      && e.getJockeyId().equals(i.getJockeyId()))
                            .findFirst();
                    if (matchingEntry.isPresent()) {
                        dto.setEntryId(matchingEntry.get().getId()); // Đính kèm ID lượt thi đấu
                        dto.setEntryStatus(matchingEntry.get().getStatus()); // Đính kèm trạng thái lượt thi đấu
                    }
                    
                    return dto; // Trả về DTO hoàn chỉnh
                })
                .collect(Collectors.toList());
    }

    // Chủ sở hữu gửi lời mời Nài ngựa điều khiển chiến mã trong trận đua
    @Transactional
    public RaceInvitationDTO inviteJockey(RaceInvitationDTO dto) {
        Integer jockeyId = dto.getJockeyId(); // ID Nài ngựa
        Integer raceId = dto.getRaceId(); // ID Trận đua
        Integer horseId = dto.getHorseId(); // ID Chiến mã

        // 1. Kiểm tra xem nài ngựa đã bận (chấp nhận suất cưỡi khác) trong trận đua này chưa
        List<RaceEntry> activeEntries = raceEntryRepository.findByRaceId(raceId);
        boolean isBooked = activeEntries.stream()
                .anyMatch(e -> e.getJockeyId().equals(jockeyId) && !"REJECTED".equals(e.getStatus()));
        if (isBooked) {
            throw new IllegalArgumentException("This jockey has already accepted a mount for this race.");
        }

        // 2. Kiểm tra xem nài ngựa đã chấp nhận lời mời nào khác trong trận đua này chưa
        List<RaceInvitation> accepted = invitationRepository.findByJockeyIdAndRaceIdAndStatus(jockeyId, raceId, "ACCEPTED");
        if (!accepted.isEmpty()) {
            throw new IllegalArgumentException("This jockey has already accepted an invitation for this race.");
        }

        // 3. Kiểm tra xem chủ ngựa đã gửi lời mời đang chờ/chấp nhận nào cho nài ngựa này với con ngựa này chưa
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

        RaceInvitation invite = invitationMapper.toEntity(dto); // Ánh xạ DTO sang Entity
        invite.setStatus("PENDING"); // Thiết lập trạng thái lời mời là PENDING

        // Tự động tính toán hoa hồng lời mời (5% giải thưởng hoặc mặc định $500)
        BigDecimal rate = new BigDecimal("5.00");
        BigDecimal purse = race.getPurse() != null ? race.getPurse() : new BigDecimal("10000.00");
        BigDecimal commission = purse.multiply(new BigDecimal("0.05"));
        invite.setCommissionRate(rate);
        invite.setCommissionAmount(commission);
        invite.setPayoutStatus("PENDING");

        RaceInvitation savedInvite = invitationRepository.save(invite); // Lưu lời mời vào DB

        Map<Integer, User> userEntityMap = userRepository.findAll().stream()
                .collect(Collectors.toMap(User::getId, u -> u, (u1, u2) -> u1));
        User owner = userEntityMap.get(savedInvite.getOwnerId());
        User jockey = userEntityMap.get(savedInvite.getJockeyId());

        String horseName = horse != null ? horse.getName() : null;
        String horseAvatar = horse != null ? horse.getAvatar() : null;
        String ownerName = owner != null ? (owner.getFullName() != null && !owner.getFullName().isBlank() ? owner.getFullName() : owner.getUsername()) : null;
        String ownerAvatar = owner != null ? owner.getAvatar() : null;
        String jockeyName = jockey != null ? (jockey.getFullName() != null && !jockey.getFullName().isBlank() ? jockey.getFullName() : jockey.getUsername()) : null;
        String jockeyAvatar = jockey != null ? jockey.getAvatar() : null;

        // Trả về DTO của lời mời mới tạo
        return invitationMapper.toDTO(savedInvite, 
                horseName, horseAvatar,
                ownerName, ownerAvatar,
                jockeyName, jockeyAvatar);
    }

    // Nài ngựa chấp nhận lời mời thi đấu
    @Transactional
    public void acceptInvitation(Integer id) {
        // Tìm lời mời thi đấu trong CSDL
        RaceInvitation invite = invitationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));

        if (!"PENDING".equals(invite.getStatus())) {
            throw new IllegalArgumentException("Invitation is not pending");
        }

        // Verify Owner has sufficient wallet balance for hire fee before accepting
        BigDecimal hireFee = invite.getHireFee() != null ? invite.getHireFee() : new BigDecimal("500.00");
        if (invite.getOwnerId() != null && hireFee.compareTo(BigDecimal.ZERO) > 0) {
            User owner = userRepository.findById(invite.getOwnerId())
                    .orElseThrow(() -> new IllegalArgumentException("Owner not found"));
            BigDecimal ownerBal = owner.getWalletBalance() != null ? owner.getWalletBalance() : BigDecimal.ZERO;
            if (ownerBal.compareTo(hireFee) < 0) {
                throw new IllegalArgumentException(String.format("Owner has insufficient wallet balance ($%,.2f available, $%,.2f required for hire fee).", ownerBal, hireFee));
            }
        }

        // Kiểm tra xem nài ngựa đã có lượt đua hoạt động nào trong trận này chưa
        List<RaceEntry> activeEntries = raceEntryRepository.findByRaceId(invite.getRaceId());
        boolean isBooked = activeEntries.stream()
                .anyMatch(e -> e.getJockeyId().equals(invite.getJockeyId()) && !"REJECTED".equals(e.getStatus()));
        if (isBooked) {
            throw new IllegalArgumentException("You already have an active mount in this race.");
        }

        // Kiểm tra xem con ngựa đã có lượt đua hoạt động nào trong trận này chưa
        boolean isHorseBooked = activeEntries.stream()
                .anyMatch(e -> e.getHorseId().equals(invite.getHorseId()) && !"REJECTED".equals(e.getStatus()));
        if (isHorseBooked) {
            throw new IllegalArgumentException("This horse already has an active entry in this race.");
        }

        // Khởi tạo lượt thi đấu chính thức RaceEntry
        Optional<User> jockeyOpt = userRepository.findById(invite.getJockeyId());
        BigDecimal weight = jockeyOpt.isPresent() && jockeyOpt.get().getWeight() != null ? jockeyOpt.get().getWeight() : BigDecimal.ZERO;

        RaceEntry entry = new RaceEntry();
        entry.setRaceId(invite.getRaceId());
        entry.setHorseId(invite.getHorseId());
        entry.setJockeyId(invite.getJockeyId());
        entry.setGateNumber(0); // Admin sẽ gán số cổng sau
        entry.setStatus("PENDING_ADMIN"); // Đặt trạng thái chờ Admin duyệt
        entry.setCarriedWeight(weight);
        entry.setPrizeMoney(BigDecimal.ZERO);
        entry.setRatingAdjustment(0);
        entry.setHandicapWeight(BigDecimal.ZERO);

        raceEntryRepository.save(entry); // Lưu lượt thi đấu vào CSDL

        // Cập nhật trạng thái lời mời sang ACCEPTED và payoutStatus sang PAID
        invite.setStatus("ACCEPTED");
        invite.setPayoutStatus("PAID");
        invitationRepository.save(invite);

        // Cộng tiền hoa hồng trực tiếp vào ví người mời (Owner/Inviter)
        if (invite.getOwnerId() != null && invite.getCommissionAmount() != null && invite.getCommissionAmount().compareTo(BigDecimal.ZERO) > 0) {
            Optional<User> inviterOpt = userRepository.findById(invite.getOwnerId());
            if (inviterOpt.isPresent()) {
                User inviter = inviterOpt.get();
                BigDecimal currentBal = inviter.getWalletBalance() != null ? inviter.getWalletBalance() : BigDecimal.ZERO;
                inviter.setWalletBalance(currentBal.add(invite.getCommissionAmount()));
                userRepository.save(inviter);
            }
        }

        // Chuyển phí thuê nài ngựa (Hire Fee) từ Chủ ngựa sang Ví tiền mặt của Kỵ sĩ (Jockey)
        if (hireFee.compareTo(BigDecimal.ZERO) > 0 && invite.getJockeyId() != null) {
            Optional<User> jockeyUserOpt = userRepository.findById(invite.getJockeyId());
            if (jockeyUserOpt.isPresent()) {
                User jockey = jockeyUserOpt.get();
                BigDecimal jWallet = jockey.getWalletBalance() != null ? jockey.getWalletBalance() : BigDecimal.ZERO;
                jockey.setWalletBalance(jWallet.add(hireFee));
                userRepository.save(jockey);
            }
            if (invite.getOwnerId() != null) {
                Optional<User> ownerOpt = userRepository.findById(invite.getOwnerId());
                if (ownerOpt.isPresent()) {
                    User owner = ownerOpt.get();
                    BigDecimal oWallet = owner.getWalletBalance() != null ? owner.getWalletBalance() : BigDecimal.ZERO;
                    owner.setWalletBalance(oWallet.subtract(hireFee));
                    userRepository.save(owner);
                }
            }
        }

        // Từ chối tất cả các lời mời đang chờ/đã chấp nhận khác cho con ngựa hoặc nài ngựa này trong trận đua
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

        // Notify Horse Owner
        notificationService.notifyOwnerOnInvitationResponse(invite, true);
    }

    // Nộp lại đơn thi đấu đã bị từ chối
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

        entry.setStatus("PENDING_ADMIN"); // Đặt lại trạng thái chờ Admin duyệt
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

    // Nài ngựa từ chối lời mời thi đấu
    @Transactional
    public void rejectInvitation(Integer id) {
        RaceInvitation invite = invitationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Invitation not found"));
        invite.setStatus("REJECTED"); // Cập nhật trạng thái sang REJECTED
        invitationRepository.save(invite); // Lưu vào CSDL

        // Notify Horse Owner
        notificationService.notifyOwnerOnInvitationResponse(invite, false);
    }

    // Chủ ngựa rút lại lời mời thi đấu đã gửi
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

        // Nếu lời mời đã được chấp nhận và đã tạo lượt thi đấu, thực hiện xóa lượt thi đấu tương ứng
        if ("ACCEPTED".equalsIgnoreCase(invite.getStatus())) {
            List<RaceEntry> entries = raceEntryRepository.findByRaceId(invite.getRaceId());
            Optional<RaceEntry> entryOpt = entries.stream()
                    .filter(e -> e.getHorseId().equals(invite.getHorseId()) && e.getJockeyId().equals(invite.getJockeyId()))
                    .findFirst();
            if (entryOpt.isPresent()) {
                raceEntryRepository.delete(entryOpt.get()); // Xóa lượt thi đấu
            }
        }

        invite.setStatus("REJECTED"); // Cập nhật trạng thái lời mời rút lại sang REJECTED
        invitationRepository.save(invite); // Lưu lời mời vào CSDL
    }
}
