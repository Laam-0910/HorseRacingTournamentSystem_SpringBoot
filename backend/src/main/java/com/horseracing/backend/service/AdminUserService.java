package com.horseracing.backend.service;

import com.horseracing.backend.dto.*;
import com.horseracing.backend.entity.*;
import com.horseracing.backend.mapper.*;
import com.horseracing.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final RaceEntryRepository raceEntryRepository;
    private final HorseRepository horseRepository;
    private final JockeyRaceMeetingRegistrationRepository jockeyRegRepository;
    private final OwnerRaceMeetingRegistrationRepository ownerRegRepository;
    private final HorseRaceMeetingRegistrationRepository horseRegRepository;
    private final UserRepository userRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final RaceRepository raceRepository;
    private final RaceMeetingRepository raceMeetingRepository;
    private final RaceRefereeRepository raceRefereeRepository;
    private final SeasonClassRuleRepository seasonClassRuleRepository;
    private final RaceInvitationRepository invitationRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final SeasonRepository seasonRepository;

    private final RaceEntryMapper raceEntryMapper;
    private final HorseMapper horseMapper;
    private final RegistrationMapper registrationMapper;
    private final UserMapper userMapper;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public Map<String, Object> getPendingRegistrations() {
        // Tải danh sách tất cả người dùng từ CSDL
        List<User> allUsers = userRepository.findAll();
        // Tải danh sách tất cả chiến mã từ CSDL
        List<Horse> allHorses = horseRepository.findAll();
        // Tải danh sách tất cả các Ngày hội đua từ CSDL
        List<RaceMeeting> allMeetings = raceMeetingRepository.findAll();
        // Tải danh sách tất cả các Trận đua từ CSDL
        List<Race> allRaces = raceRepository.findAll();

        // Gom nhóm người dùng thành Map với key là User ID để tra cứu nhanh
        Map<Integer, User> userMap = allUsers.stream().collect(Collectors.toMap(User::getId, u -> u));
        // Gom nhóm chiến mã thành Map với key là Horse ID
        Map<Integer, Horse> horseMap = allHorses.stream().collect(Collectors.toMap(Horse::getId, h -> h));
        // Gom nhóm Ngày hội đua thành Map với key là Meeting ID
        Map<Integer, RaceMeeting> meetingMap = allMeetings.stream().collect(Collectors.toMap(RaceMeeting::getId, m -> m));
        // Gom nhóm Trận đua thành Map với key là Race ID
        Map<Integer, Race> raceMap = allRaces.stream().collect(Collectors.toMap(Race::getId, r -> r));

        // 1. Danh sách lượt đăng ký thi đấu chờ Admin duyệt (PENDING_ADMIN)
        List<RaceEntry> pendingEntries = raceEntryRepository.findAll().stream()
                .filter(e -> "PENDING_ADMIN".equalsIgnoreCase(e.getStatus())).toList();
        // Khởi tạo danh sách chứa dữ liệu tổng hợp lượt đăng ký
        List<Map<String, Object>> entriesData = new ArrayList<>();

        // Tải trọng số dự đoán chiến thắng từ bảng cấu hình hệ thống (mặc định 0.40, 0.25, 0.20, 0.15)
        double weightHorse = Double.parseDouble(systemConfigRepository.findById("PREDICT_WEIGHT_HORSE").map(SystemConfig::getConfigValue).orElse("0.40"));
        double weightJockey = Double.parseDouble(systemConfigRepository.findById("PREDICT_WEIGHT_JOCKEY").map(SystemConfig::getConfigValue).orElse("0.25"));
        double weightClass = Double.parseDouble(systemConfigRepository.findById("PREDICT_WEIGHT_CLASS").map(SystemConfig::getConfigValue).orElse("0.20"));
        double weightForm = Double.parseDouble(systemConfigRepository.findById("PREDICT_WEIGHT_FORM").map(SystemConfig::getConfigValue).orElse("0.15"));

        // Cache lưu quy định phân hạng theo Season ID để tránh truy vấn lại CSDL nhiều lần
        Map<Integer, List<SeasonClassRule>> seasonRulesCache = new HashMap<>();

        // Duyệt từng lượt đăng ký chờ duyệt
        for (RaceEntry entry : pendingEntries) {
            Map<String, Object> map = new HashMap<>(); // Khởi tạo Map chứa dữ liệu lượt đăng ký chi tiết
            
            Horse horse = horseMap.get(entry.getHorseId()); // Lấy thông tin con ngựa
            User owner = horse != null ? userMap.get(horse.getOwnerId()) : null; // Lấy thông tin chủ ngựa
            User jockey = userMap.get(entry.getJockeyId()); // Lấy thông tin nài ngựa
            Race race = raceMap.get(entry.getRaceId()); // Lấy thông tin trận đua
            RaceMeeting meeting = race != null ? meetingMap.get(race.getRaceMeetingId()) : null; // Lấy thông tin Ngày hội đua

            // Ánh xạ đối tượng lượt đăng ký thi đấu sang DTO
            map.put("entry", raceEntryMapper.toDTO(entry, horse != null ? horse.getName() : null, jockey != null ? jockey.getUsername() : null));
            // Ánh xạ đối tượng chiến mã sang DTO
            map.put("horse", horseMapper.toDTO(horse, owner != null ? owner.getUsername() : null));
            // Ánh xạ đối tượng chủ ngựa sang DTO
            map.put("owner", userMapper.toDTO(owner));
            // Ánh xạ đối tượng nài ngựa sang DTO
            map.put("jockey", userMapper.toDTO(jockey));
            
            // Thiết lập chi tiết thông tin trận đua
            if (race != null) {
                map.put("race", RaceDTO.builder()
                        .id(race.getId())
                        .raceMeetingId(race.getRaceMeetingId())
                        .startTime(race.getStartTime())
                        .status(race.getStatus())
                        .classLevel(race.getClassLevel())
                        .distanceMeters(race.getDistanceMeters())
                        .trackType(race.getTrackType())
                        .minEntries(race.getMinEntries())
                        .build());
            } else {
                map.put("race", null); // Đặt null nếu không tìm thấy trận đua
            }
            // Thiết lập chi tiết thông tin Ngày hội đua
            map.put("meeting", meeting != null ? RaceMeetingDTO.builder().id(meeting.getId()).name(meeting.getName()).build() : null);

            // Tính toán Điểm Tỷ lệ Thắng của Ngựa (Horse Win Rate Score)
            double horseWinRateScore = 0;
            if (horse != null && horse.getTotalRaces() != null && horse.getTotalRaces() > 0) {
                horseWinRateScore = ((double) horse.getTotalWins() / horse.getTotalRaces()) * 100;
            }

            // Tính toán Điểm Kỹ năng của Nài ngựa (Jockey Skill Score)
            double jockeySkillScore = 0;
            if (jockey != null && jockey.getTotalRacesParticipated() != null && jockey.getTotalRacesParticipated() > 0) {
                jockeySkillScore = ((double) jockey.getTotalTop3Finishes() / jockey.getTotalRacesParticipated()) * 100;
            }

            // Tính toán Điểm Phân hạng Hạng đua (Class Score)
            double classScore = 20;
            String horseClass = "Class 5";
            if (horse != null && horse.getCurrentRating() != null && race != null) {
                int rating = horse.getCurrentRating(); // Điểm rating hiện tại của ngựa
                Integer seasonId = meeting != null ? meeting.getSeasonId() : null; // Lấy mùa giải tương ứng
                List<SeasonClassRule> rules = null;
                if (seasonId != null) {
                    if (!seasonRulesCache.containsKey(seasonId)) {
                        seasonRulesCache.put(seasonId, seasonClassRuleRepository.findBySeasonId(seasonId)); // Lưu cache quy định hạng
                    }
                    rules = seasonRulesCache.get(seasonId); // Lấy danh sách quy định hạng từ cache
                }

                SeasonClassRule matchedRule = null;
                if (rules != null) {
                    for (SeasonClassRule rule : rules) {
                        int min = rule.getMinRating() != null ? rule.getMinRating() : 0; // Rating tối thiểu
                        int max = rule.getMaxRating() != null ? rule.getMaxRating() : 999; // Rating tối đa
                        if (rating >= min && rating <= max) {
                            matchedRule = rule; // Khớp quy tắc phân hạng
                            break;
                        }
                    }
                }

                if (matchedRule != null) {
                    horseClass = matchedRule.getClassLevel(); // Gán tên hạng khớp
                    if ("Class 1".equalsIgnoreCase(horseClass)) classScore = 100;
                    else if ("Class 2".equalsIgnoreCase(horseClass)) classScore = 80;
                    else if ("Class 3".equalsIgnoreCase(horseClass)) classScore = 60;
                    else if ("Class 4".equalsIgnoreCase(horseClass)) classScore = 40;
                    else classScore = 20;
                } else { // Fallback phân hạng thủ công nếu không có quy định mùa giải
                    if (rating >= 95) {
                        classScore = 100;
                        horseClass = "Class 1";
                    } else if (rating >= 80) {
                        classScore = 80;
                        horseClass = "Class 2";
                    } else if (rating >= 60) {
                        classScore = 60;
                        horseClass = "Class 3";
                    } else if (rating >= 40) {
                        classScore = 40;
                        horseClass = "Class 4";
                    } else {
                        classScore = 20;
                        horseClass = "Class 5";
                    }
                }
            }

            // Tính toán Điểm Phong độ gần đây (Recent Form Score - 5 trận gần nhất)
            double recentFormScore = 0;
            if (horse != null) {
                List<RaceEntry> pastRaces = raceEntryRepository.findByHorseId(horse.getId()); // Tìm các trận đua trước đó
                int racesCount = 0;
                double formPoints = 0;
                if (pastRaces != null) {
                    for (int i = pastRaces.size() - 1; i >= 0 && racesCount < 5; i--) {
                        RaceEntry past = pastRaces.get(i);
                        if (("COMPLETED".equalsIgnoreCase(past.getStatus()) || "FINISHED".equalsIgnoreCase(past.getStatus())) && past.getFinalPosition() != null) {
                            int pos = past.getFinalPosition();
                            if (pos == 1) formPoints += 10;
                            else if (pos == 2) formPoints += 7;
                            else if (pos == 3) formPoints += 5;
                            else if (pos == 4) formPoints += 3;
                            else if (pos == 5) formPoints += 1;
                            racesCount++;
                        }
                    }
                }
                recentFormScore = (formPoints / 50.0) * 100; // Quy đổi phong độ thành điểm 100
            }

            // Tính toán Điểm Dự đoán tổng hợp dựa trên các trọng số cấu hình
            double predictionScore = (horseWinRateScore * weightHorse) +
                                     (jockeySkillScore * weightJockey) +
                                     (classScore * weightClass) +
                                     (recentFormScore * weightForm);

            // Đưa các chỉ số dự đoán đã làm tròn vào map trả về
            map.put("horseWinRateScore", String.format(Locale.US, "%.2f", horseWinRateScore));
            map.put("jockeySkillScore", String.format(Locale.US, "%.2f", jockeySkillScore));
            map.put("classScore", String.format(Locale.US, "%.2f", classScore));
            map.put("horseClass", horseClass);
            map.put("recentFormScore", String.format(Locale.US, "%.2f", recentFormScore));
            map.put("predictionScore", String.format(Locale.US, "%.2f", predictionScore));

            entriesData.add(map); // Thêm thông tin lượt đăng ký vào danh sách kết quả
        }

        // 2. Danh sách đơn đăng ký Ngựa tham gia Ngày hội đua chờ duyệt (PENDING)
        List<HorseRaceMeetingRegistration> pendingHorseRegs = horseRegRepository.findAll().stream()
                .filter(r -> "PENDING".equals(r.getStatus())).toList();
        List<Map<String, Object>> pendingHorseRegsData = new ArrayList<>();
        // Duyệt từng đơn đăng ký Ngựa
        for (HorseRaceMeetingRegistration reg : pendingHorseRegs) {
            Map<String, Object> map = new HashMap<>();
            Horse horse = horseMap.get(reg.getHorseId()); // Tra cứu thông tin chiến mã
            User owner = horse != null ? userMap.get(horse.getOwnerId()) : null; // Tra cứu chủ sở hữu
            RaceMeeting meeting = meetingMap.get(reg.getRaceMeetingId()); // Tra cứu Ngày hội đua

            map.put("registration", registrationMapper.toDTO(reg, horse != null ? horse.getName() : null, meeting != null ? meeting.getName() : null));
            map.put("horse", horseMapper.toDTO(horse, owner != null ? owner.getUsername() : null));
            map.put("owner", userMapper.toDTO(owner));
            map.put("meeting", meeting != null ? RaceMeetingDTO.builder().id(meeting.getId()).name(meeting.getName()).build() : null);
            pendingHorseRegsData.add(map);
        }

        // 3. Danh sách đơn đăng ký Nài ngựa tham gia Ngày hội đua chờ duyệt (PENDING)
        List<JockeyRaceMeetingRegistration> pendingJockeyRegs = jockeyRegRepository.findAll().stream()
                .filter(r -> "PENDING".equals(r.getStatus())).toList();
        List<Map<String, Object>> pendingJockeyRegsData = new ArrayList<>();
        // Duyệt từng đơn đăng ký Nài ngựa
        for (JockeyRaceMeetingRegistration reg : pendingJockeyRegs) {
            Map<String, Object> map = new HashMap<>();
            User jockey = userMap.get(reg.getJockeyId()); // Tra cứu thông tin nài ngựa
            RaceMeeting meeting = meetingMap.get(reg.getRaceMeetingId()); // Tra cứu Ngày hội đua

            map.put("registration", registrationMapper.toDTO(reg, jockey != null ? jockey.getUsername() : null, meeting != null ? meeting.getName() : null));
            map.put("jockey", userMapper.toDTO(jockey));
            map.put("meeting", meeting != null ? RaceMeetingDTO.builder().id(meeting.getId()).name(meeting.getName()).ticketPrice(meeting.getTicketPrice()).build() : null);
            map.put("ticketPaid", true);
            map.put("ticketPrice", meeting != null ? meeting.getTicketPrice() : BigDecimal.ZERO);
            pendingJockeyRegsData.add(map);
        }

        // 3.5. Danh sách đơn đăng ký Chủ ngựa tham gia Ngày hội đua chờ duyệt (PENDING)
        List<OwnerRaceMeetingRegistration> pendingOwnerRegs = ownerRegRepository.findAll().stream()
                .filter(r -> "PENDING".equals(r.getStatus())).toList();
        List<Map<String, Object>> pendingOwnerRegsData = new ArrayList<>();
        // Duyệt từng đơn đăng ký Chủ ngựa
        for (OwnerRaceMeetingRegistration reg : pendingOwnerRegs) {
            Map<String, Object> map = new HashMap<>();
            User owner = userMap.get(reg.getOwnerId()); // Tra cứu thông tin chủ sở hữu
            RaceMeeting meeting = meetingMap.get(reg.getRaceMeetingId()); // Tra cứu Ngày hội đua

            map.put("registration", registrationMapper.toDTO(reg, owner != null ? owner.getUsername() : null, meeting != null ? meeting.getName() : null));
            map.put("owner", userMapper.toDTO(owner));
            map.put("meeting", meeting != null ? RaceMeetingDTO.builder().id(meeting.getId()).name(meeting.getName()).ticketPrice(meeting.getTicketPrice()).build() : null);
            map.put("ticketPaid", true);
            map.put("ticketPrice", meeting != null ? meeting.getTicketPrice() : BigDecimal.ZERO);
            pendingOwnerRegsData.add(map);
        }

        // 4. Danh sách Hồ sơ Ngựa đăng ký mới trong hệ thống chờ duyệt (PENDING)
        List<Horse> pendingSystemHorses = horseRepository.findAll().stream()
                .filter(h -> "PENDING".equals(h.getStatus())).toList();
        List<Map<String, Object>> pendingSystemHorsesData = new ArrayList<>();
        // Duyệt từng hồ sơ ngựa mới
        for (Horse h : pendingSystemHorses) {
            Map<String, Object> map = new HashMap<>();
            User owner = userMap.get(h.getOwnerId()); // Tra cứu thông tin chủ sở hữu
            map.put("horse", horseMapper.toDTO(h, owner != null ? owner.getUsername() : null));
            map.put("owner", userMapper.toDTO(owner));
            pendingSystemHorsesData.add(map);
        }

        // Tính tổng số lượng yêu cầu đang chờ phê duyệt
        long totalPendingCount = pendingEntries.size() + pendingHorseRegs.size() + pendingJockeyRegs.size() + pendingOwnerRegs.size() + pendingSystemHorses.size();

        // Đếm tổng số lượng đơn đã được phê duyệt trong hệ thống
        long approvedCount = 
                raceEntryRepository.findAll().stream().filter(e -> "APPROVED".equalsIgnoreCase(e.getStatus()) || "CONFIRMED".equalsIgnoreCase(e.getStatus())).count() +
                horseRegRepository.findAll().stream().filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus())).count() +
                jockeyRegRepository.findAll().stream().filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus())).count() +
                ownerRegRepository.findAll().stream().filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus())).count() +
                horseRepository.findAll().stream().filter(h -> "ACTIVE".equalsIgnoreCase(h.getStatus())).count();

        // Đếm tổng số lượng đơn đã bị từ chối trong hệ thống
        long rejectedCount = 
                raceEntryRepository.findAll().stream().filter(e -> "REJECTED".equalsIgnoreCase(e.getStatus())).count() +
                horseRegRepository.findAll().stream().filter(r -> "REJECTED".equalsIgnoreCase(r.getStatus())).count() +
                jockeyRegRepository.findAll().stream().filter(r -> "REJECTED".equalsIgnoreCase(r.getStatus())).count() +
                ownerRegRepository.findAll().stream().filter(r -> "REJECTED".equalsIgnoreCase(r.getStatus())).count() +
                horseRepository.findAll().stream().filter(h -> "REJECTED".equalsIgnoreCase(h.getStatus())).count();

        // Tổng hợp tất cả thông số dữ liệu trả về cho Frontend Dashboard Admin
        Map<String, Object> response = new HashMap<>();
        response.put("entriesData", entriesData);
        response.put("pendingHorseRegsData", pendingHorseRegsData);
        response.put("pendingJockeyRegsData", pendingJockeyRegsData);
        response.put("pendingOwnerRegsData", pendingOwnerRegsData);
        response.put("pendingSystemHorsesData", pendingSystemHorsesData);
        response.put("awaitingDecisionCount", totalPendingCount);
        response.put("approvedCount", approvedCount);
        response.put("rejectedCount", rejectedCount);

        return response; // Trả về Map kết quả tổng hợp
    }

    // Phê duyệt lượt đăng ký thi đấu của ngựa/nài trong trận đua
    @Transactional
    public void approveRaceEntry(Integer id) {
        // Tìm lượt đăng ký theo ID trong CSDL
        RaceEntry entry = raceEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found"));
        entry.setStatus("APPROVED"); // Cập nhật trạng thái sang APPROVED
        raceEntryRepository.save(entry); // Lưu đối tượng đã duyệt vào DB

        autoAssignGates(entry.getRaceId());
        autoCalculateWeights(entry.getRaceId());
        RaceEntry target = raceEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found"));

        List<RaceEntry> raceEntries = raceEntryRepository.findByRaceId(target.getRaceId());

        // 1. Check if jockey already has an APPROVED entry in this race
        if (target.getJockeyId() != null) {
            boolean jockeyAlreadyApproved = raceEntries.stream()
                    .anyMatch(e -> !e.getId().equals(target.getId())
                            && target.getJockeyId().equals(e.getJockeyId())
                            && "APPROVED".equalsIgnoreCase(e.getStatus()));
            if (jockeyAlreadyApproved) {
                throw new IllegalArgumentException("This jockey has already been approved for another horse in this race.");
            }
        }

        // 2. Check if horse already has an APPROVED entry in this race
        boolean horseAlreadyApproved = raceEntries.stream()
                .anyMatch(e -> !e.getId().equals(target.getId())
                        && target.getHorseId().equals(e.getHorseId())
                        && "APPROVED".equalsIgnoreCase(e.getStatus()));
        if (horseAlreadyApproved) {
            throw new IllegalArgumentException("This horse has already been approved to participate in this race.");
        }

        // 3. Approve target entry
        target.setStatus("APPROVED");
        raceEntryRepository.save(target);

        // Đánh dấu tiền cọc thuê nài (Hire Fee) được giữ an toàn trong Escrow Vault chờ giải đấu hoàn tất
        invitationRepository.findByJockeyIdAndRaceIdAndHorseId(target.getJockeyId(), target.getRaceId(), target.getHorseId())
                .stream()
                .filter(i -> "ACCEPTED".equalsIgnoreCase(i.getStatus()))
                .forEach(i -> {
                    i.setPayoutStatus("HELD");
                    invitationRepository.save(i);
                });

        // 4. Auto-reject other pending entries for the same jockey or horse in this race
        for (RaceEntry other : raceEntries) {
            if (!other.getId().equals(target.getId())) {
                boolean sameJockey = target.getJockeyId() != null && target.getJockeyId().equals(other.getJockeyId());
                boolean sameHorse = target.getHorseId().equals(other.getHorseId());
                if ((sameJockey || sameHorse) && !"REJECTED".equalsIgnoreCase(other.getStatus()) && !"APPROVED".equalsIgnoreCase(other.getStatus())) {
                    other.setStatus("REJECTED");
                    raceEntryRepository.save(other);
                    invitationRepository.findByJockeyIdAndRaceIdAndHorseId(other.getJockeyId(), other.getRaceId(), other.getHorseId())
                            .stream()
                            .filter(i -> "ACCEPTED".equalsIgnoreCase(i.getStatus()))
                            .forEach(i -> {
                                i.setStatus("REJECTED");
                                // Nếu có tiền cọc bị hủy do trùng lặp, hoàn tiền về cho Owner
                                BigDecimal hireFee = i.getHireFee() != null ? i.getHireFee() : new BigDecimal("500000.00");
                                if ("HELD".equalsIgnoreCase(i.getPayoutStatus()) && hireFee.compareTo(BigDecimal.ZERO) > 0 && i.getOwnerId() != null) {
                                    Optional<User> ownerOpt = userRepository.findById(i.getOwnerId());
                                    if (ownerOpt.isPresent()) {
                                        User owner = ownerOpt.get();
                                        BigDecimal oWallet = owner.getWalletBalance() != null ? owner.getWalletBalance() : BigDecimal.ZERO;
                                        owner.setWalletBalance(oWallet.add(hireFee));
                                        userRepository.save(owner);

                                        WalletTransaction txOwner = new WalletTransaction();
                                        txOwner.setUserId(owner.getId());
                                        txOwner.setAmount(hireFee);
                                        txOwner.setTransactionType("HIRE_FEE_REFUND");
                                        txOwner.setDescription("Jockey hire fee refund from Escrow Vault for invitation #" + i.getId());
                                        txOwner.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                                        walletTransactionRepository.save(txOwner);
                                    }
                                    i.setPayoutStatus("REFUNDED");
                                }
                                invitationRepository.save(i);
                            });
                }
            }
        }

        // 5. Send notification to Owner and Jockey
        notificationService.notifyPartiesOnRaceEntryDecision(target, true);

        autoAssignGates(target.getRaceId());
        autoCalculateWeights(target.getRaceId());
    }

    // Từ chối lượt đăng ký thi đấu của ngựa/nài trong trận đua
    @Transactional
    public void rejectRaceEntry(Integer id) {
        // Tìm lượt đăng ký theo ID trong CSDL
        RaceEntry entry = raceEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found"));
        entry.setStatus("REJECTED"); // Cập nhật trạng thái sang REJECTED
        raceEntryRepository.save(entry); // Lưu đối tượng bị từ chối vào DB

        // Reject the corresponding invitation so the jockey is freed up, and refund Escrow hire fee to Owner
        invitationRepository.findByJockeyIdAndRaceIdAndHorseId(entry.getJockeyId(), entry.getRaceId(), entry.getHorseId())
                .stream()
                .filter(i -> "ACCEPTED".equalsIgnoreCase(i.getStatus()))
                .forEach(i -> {
                    i.setStatus("REJECTED"); // Đổi trạng thái lời mời thành REJECTED

                    // Hoàn trả 100% tiền tạm giữ Escrow (500,000 VNĐ) về cho ví Owner
                    BigDecimal hireFee = i.getHireFee() != null ? i.getHireFee() : new BigDecimal("500000.00");
                    if ("HELD".equalsIgnoreCase(i.getPayoutStatus()) && hireFee.compareTo(BigDecimal.ZERO) > 0 && i.getOwnerId() != null) {
                        Optional<User> ownerOpt = userRepository.findById(i.getOwnerId());
                        if (ownerOpt.isPresent()) {
                            User owner = ownerOpt.get();
                            BigDecimal oWallet = owner.getWalletBalance() != null ? owner.getWalletBalance() : BigDecimal.ZERO;
                            owner.setWalletBalance(oWallet.add(hireFee));
                            userRepository.save(owner);

                            WalletTransaction txOwner = new WalletTransaction();
                            txOwner.setUserId(owner.getId());
                            txOwner.setAmount(hireFee);
                            txOwner.setTransactionType("HIRE_FEE_REFUND");
                            txOwner.setDescription("Jockey hire fee refund from Escrow Vault for invitation #" + i.getId() + " (Race Entry #" + id + " rejected by Steward)");
                            txOwner.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                            walletTransactionRepository.save(txOwner);
                        }
                        i.setPayoutStatus("REFUNDED");
                    }

                    invitationRepository.save(i); // Lưu lời mời đã cập nhật vào DB
                });

        // Send notification to Owner and Jockey
        notificationService.notifyPartiesOnRaceEntryDecision(entry, false);

        autoCalculateWeights(entry.getRaceId());
    }

    // Phê duyệt đăng ký Nài ngựa tham gia Ngày hội đua
    @Transactional
    public void approveJockeyReg(Integer id) {
        JockeyRaceMeetingRegistration reg = jockeyRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("APPROVED");
        jockeyRegRepository.save(reg);

        notificationService.notifyMeetingRegistrationDecision("Jockey", reg.getJockeyId(), reg.getRaceMeetingId(), null, true);
    }

    // Từ chối đăng ký Nài ngựa tham gia Ngày hội đua
    @Transactional
    public void rejectJockeyReg(Integer id) {
        JockeyRaceMeetingRegistration reg = jockeyRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));

        if (!"REJECTED".equalsIgnoreCase(reg.getStatus())) {
            // Hoàn lại tiền vé về cho Jockey
            RaceMeeting meeting = raceMeetingRepository.findById(reg.getRaceMeetingId()).orElse(null);
            BigDecimal ticketPrice = meeting != null && meeting.getTicketPrice() != null ? meeting.getTicketPrice() : BigDecimal.ZERO;
            if (ticketPrice.compareTo(BigDecimal.ZERO) > 0 && reg.getJockeyId() != null) {
                userRepository.findById(reg.getJockeyId()).ifPresent(jockey -> {
                    BigDecimal curBal = jockey.getWalletBalance() != null ? jockey.getWalletBalance() : BigDecimal.ZERO;
                    jockey.setWalletBalance(curBal.add(ticketPrice));
                    userRepository.save(jockey);

                    WalletTransaction tx = new WalletTransaction();
                    tx.setUserId(jockey.getId());
                    tx.setAmount(ticketPrice);
                    tx.setTransactionType("TICKET_REFUND");
                    tx.setDescription("Refund ticket fee for Race Meeting: " + (meeting != null ? meeting.getName() : ""));
                    tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                    walletTransactionRepository.save(tx);
                });
            }
        }

        reg.setStatus("REJECTED");
        jockeyRegRepository.save(reg);

        notificationService.notifyMeetingRegistrationDecision("Jockey", reg.getJockeyId(), reg.getRaceMeetingId(), null, false);
    }

    // Phê duyệt đăng ký Chủ ngựa tham gia Ngày hội đua
    @Transactional
    public void approveOwnerReg(Integer id) {
        OwnerRaceMeetingRegistration reg = ownerRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("APPROVED");
        ownerRegRepository.save(reg);

        // Tự động phê duyệt tất cả đơn đăng ký chiến mã của Chủ ngựa này cho Buổi đua
        if (reg.getOwnerId() != null && reg.getRaceMeetingId() != null) {
            List<Horse> ownerHorses = horseRepository.findByOwnerId(reg.getOwnerId());
            for (Horse horse : ownerHorses) {
                if ("ACTIVE".equalsIgnoreCase(horse.getStatus()) || horse.getStatus() == null) {
                    horseRegRepository.findByRaceMeetingIdAndHorseId(reg.getRaceMeetingId(), horse.getId())
                            .ifPresent(hReg -> {
                                if (!"APPROVED".equalsIgnoreCase(hReg.getStatus())) {
                                    hReg.setStatus("APPROVED");
                                    horseRegRepository.save(hReg);
                                }
                            });
                }
            }
        }

        notificationService.notifyMeetingRegistrationDecision("Horse Owner", reg.getOwnerId(), reg.getRaceMeetingId(), null, true);
    }

    // Từ chối đăng ký Chủ ngựa tham gia Ngày hội đua
    @Transactional
    public void rejectOwnerReg(Integer id) {
        OwnerRaceMeetingRegistration reg = ownerRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));

        if (!"REJECTED".equalsIgnoreCase(reg.getStatus())) {
            // Hoàn lại tiền vé về cho Owner và trừ tiền khỏi Ví Admin
            RaceMeeting meeting = raceMeetingRepository.findById(reg.getRaceMeetingId()).orElse(null);
            BigDecimal ticketPrice = meeting != null && meeting.getTicketPrice() != null ? meeting.getTicketPrice() : BigDecimal.ZERO;
            if (ticketPrice.compareTo(BigDecimal.ZERO) > 0 && reg.getOwnerId() != null) {
                userRepository.findById(reg.getOwnerId()).ifPresent(owner -> {
                    BigDecimal curBal = owner.getWalletBalance() != null ? owner.getWalletBalance() : BigDecimal.ZERO;
                    owner.setWalletBalance(curBal.add(ticketPrice));
                    userRepository.save(owner);

                    WalletTransaction tx = new WalletTransaction();
                    tx.setUserId(owner.getId());
                    tx.setAmount(ticketPrice);
                    tx.setTransactionType("TICKET_REFUND");
                    tx.setDescription("Ticket fee refund from Escrow Vault for Race Meeting: " + (meeting != null ? meeting.getName() : ""));
                    tx.setRaceMeetingId(reg.getRaceMeetingId());
                    tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                    walletTransactionRepository.save(tx);
                });
            }
        }

        reg.setStatus("REJECTED");
        ownerRegRepository.save(reg);

        // Tự động chuyển trạng thái REJECTED cho toàn bộ chiến mã thuộc sở hữu của chủ ngựa đối với Buổi đua này
        if (reg.getOwnerId() != null && reg.getRaceMeetingId() != null) {
            List<Horse> ownerHorses = horseRepository.findByOwnerId(reg.getOwnerId());
            for (Horse h : ownerHorses) {
                horseRegRepository.findByRaceMeetingIdAndHorseId(reg.getRaceMeetingId(), h.getId()).ifPresent(hReg -> {
                    hReg.setStatus("REJECTED");
                    horseRegRepository.save(hReg);
                });
            }
        }

        notificationService.notifyMeetingRegistrationDecision("Horse Owner", reg.getOwnerId(), reg.getRaceMeetingId(), null, false);
    }


    // Lấy chi tiết danh sách người dùng (Jockey & Owner) đã đăng ký tham gia RaceMeeting kèm thông tin vé
    @Transactional(readOnly = true)
    public Map<String, Object> getMeetingRegistrationsDetails(Integer meetingId) {
        RaceMeeting meeting = raceMeetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Race meeting not found"));

        BigDecimal ticketPrice = meeting.getTicketPrice() != null ? meeting.getTicketPrice() : BigDecimal.ZERO;

        List<JockeyRaceMeetingRegistration> jockeyRegs = jockeyRegRepository.findByRaceMeetingId(meetingId);
        List<OwnerRaceMeetingRegistration> ownerRegs = ownerRegRepository.findByRaceMeetingId(meetingId);

        List<Map<String, Object>> registrants = new ArrayList<>();

        for (JockeyRaceMeetingRegistration reg : jockeyRegs) {
            Map<String, Object> item = new HashMap<>();
            item.put("registrationId", reg.getId());
            item.put("meetingId", meetingId);
            item.put("userId", reg.getJockeyId());
            item.put("registeredAt", reg.getRegisteredAt());
            item.put("status", reg.getStatus());
            item.put("role", "Jockey");
            item.put("ticketPrice", BigDecimal.ZERO);
            item.put("paymentStatus", "FREE");

            userRepository.findById(reg.getJockeyId()).ifPresent(u -> {
                item.put("username", u.getUsername());
                item.put("fullName", u.getFullName());
                item.put("email", u.getEmail());
                item.put("walletBalance", u.getWalletBalance());
            });
            registrants.add(item);
        }

        for (OwnerRaceMeetingRegistration reg : ownerRegs) {
            Map<String, Object> item = new HashMap<>();
            item.put("registrationId", reg.getId());
            item.put("meetingId", meetingId);
            item.put("userId", reg.getOwnerId());
            item.put("registeredAt", reg.getRegisteredAt());
            item.put("status", reg.getStatus());
            item.put("role", "HorseOwner");
            item.put("ticketPrice", ticketPrice);
            item.put("paymentStatus", "REJECTED".equalsIgnoreCase(reg.getStatus()) ? "REFUNDED" : "PAID");

            userRepository.findById(reg.getOwnerId()).ifPresent(u -> {
                item.put("username", u.getUsername());
                item.put("fullName", u.getFullName());
                item.put("email", u.getEmail());
                item.put("walletBalance", u.getWalletBalance());
            });
            registrants.add(item);
        }

        Map<String, Object> res = new HashMap<>();
        res.put("meetingId", meetingId);
        res.put("meetingName", meeting.getName());
        res.put("ticketPrice", ticketPrice);
        res.put("totalRegistrants", registrants.size());
        res.put("registrants", registrants);
        return res;
    }

    // Phê duyệt đăng ký Ngựa đua tham gia Ngày hội đua
    @Transactional
    public void approveHorseReg(Integer id) {
        HorseRaceMeetingRegistration reg = horseRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("APPROVED"); // Cập nhật trạng thái đăng ký sang APPROVED
        
        Optional<Horse> horseOpt = horseRepository.findById(reg.getHorseId());
        if (horseOpt.isPresent()) {
            Horse horse = horseOpt.get();
            horse.setStatus("ACTIVE"); // Đổi trạng thái hoạt động của con ngựa thành ACTIVE
            horseRepository.save(horse);

            // Tự động phê duyệt đơn đăng ký của chủ ngựa tương ứng nếu có
            if (horse.getOwnerId() != null && reg.getRaceMeetingId() != null) {
                Optional<OwnerRaceMeetingRegistration> ownerRegOpt =
                        ownerRegRepository.findByRaceMeetingIdAndOwnerId(reg.getRaceMeetingId(), horse.getOwnerId());
                if (ownerRegOpt.isPresent()) {
                    OwnerRaceMeetingRegistration ownerReg = ownerRegOpt.get();
                    if (!"APPROVED".equalsIgnoreCase(ownerReg.getStatus())) {
                        ownerReg.setStatus("APPROVED"); // Tự động duyệt cho chủ ngựa
                        ownerRegRepository.save(ownerReg);
                    }
                }

                notificationService.notifyMeetingRegistrationDecision(
                    "Horse", horse.getOwnerId(), reg.getRaceMeetingId(), horse.getName(), true
                );
            }
        }
        horseRegRepository.save(reg); // Lưu bản ghi đăng ký đã cập nhật
    }

    // Từ chối đăng ký Ngựa đua tham gia Ngày hội đua
    @Transactional
    public void rejectHorseReg(Integer id) {
        HorseRaceMeetingRegistration reg = horseRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("REJECTED"); // Cập nhật trạng thái sang REJECTED
        
        Optional<Horse> horseOpt = horseRepository.findById(reg.getHorseId());
        if (horseOpt.isPresent()) {
            Horse horse = horseOpt.get();
            horse.setStatus("INACTIVE"); // Chuyển trạng thái con ngựa về INACTIVE
            horseRepository.save(horse);

            if (horse.getOwnerId() != null) {
                notificationService.notifyMeetingRegistrationDecision(
                    "Horse", horse.getOwnerId(), reg.getRaceMeetingId(), horse.getName(), false
                );
            }
        }

        horseRegRepository.save(reg); // Lưu bản ghi đăng ký đã cập nhật
    }

    // Phê duyệt hồ sơ chiến mã mới đăng ký vào hệ thống
    @Transactional
    public void approveSystemHorse(Integer id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        horse.setStatus("ACTIVE"); // Phê duyệt trạng thái hoạt động ACTIVE
        horseRepository.save(horse); // Lưu vào DB

        if (horse.getOwnerId() != null) {
            notificationService.notifyUserOnAdminDecision(
                "New Horse Registry Declaration for '" + horse.getName() + "'",
                horse.getOwnerId(), id, true
            );
        }
    }

    // Từ chối hồ sơ chiến mã mới đăng ký vào hệ thống
    @Transactional
    public void rejectSystemHorse(Integer id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        horse.setStatus("REJECTED"); // Từ chối trạng thái REJECTED
        horseRepository.save(horse); // Lưu vào DB

        if (horse.getOwnerId() != null) {
            notificationService.notifyUserOnAdminDecision(
                "New Horse Registry Declaration for '" + horse.getName() + "'",
                horse.getOwnerId(), id, false
            );
        }
    }

    // Tự động phân bổ cổng xuất phát (Gate Assignment) ngẫu nhiên cho các thí sinh đã duyệt
    @Transactional
    public void autoAssignGates(Integer raceId) {
        if (raceId == null) return; // Nếu mã trận đua bị null thì kết thúc
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId); // Lấy danh sách thí sinh đăng ký
        List<RaceEntry> activeEntries = entries.stream()
                .filter(e -> !"REJECTED".equalsIgnoreCase(e.getStatus()) && !"DISQUALIFIED".equalsIgnoreCase(e.getStatus()))
                .toList(); // Lọc tất cả thí sinh hợp lệ

        int count = activeEntries.size(); // Số lượng thí sinh tham gia
        List<Integer> gates = new ArrayList<>(); // Khởi tạo danh sách vị trí cổng xuất phát
        for (int i = 1; i <= Math.min(count, 12); i++) {
            gates.add(i); // Đưa các số cổng từ 1 đến tối đa 12 vào danh sách
        }
        Collections.shuffle(gates); // Xáo trộn ngẫu nhiên thứ tự các cổng xuất phát

        for (int i = 0; i < activeEntries.size(); i++) {
            RaceEntry entry = activeEntries.get(i);
            if (i < gates.size()) {
                entry.setGateNumber(gates.get(i)); // Gán cổng ngẫu nhiên cho từng thí sinh
            } else {
                entry.setGateNumber(0); // Nếu vượt quá số cổng thì đặt 0
            }
            raceEntryRepository.save(entry); // Lưu thông tin cổng mới vào CSDL
        }

        // Cập nhật trạng thái trận đua sang RACE_ASSIGNED nếu đăng ký đã đóng
        raceRepository.findById(raceId).ifPresent(race -> {
            if ("DECLARATION_CLOSED".equals(race.getStatus())) {
                race.setStatus("RACE_ASSIGNED"); // Đổi trạng thái trận đua
                raceRepository.save(race); // Lưu trận đua vào CSDL
            }
        });
    }

    // Tự động tính toán mốc cân nặng Handicap và Carried Weight theo thuật toán phân hạng
    @Transactional
    public void autoCalculateWeights(Integer raceId) {
        if (raceId == null) return; // Bỏ qua nếu raceId rỗng

        // Tải các thông số cấu hình cân nặng từ CSDL
        double maxTopWeight = systemConfigRepository.findById("MAX_TOP_WEIGHT")
                .map(c -> Double.parseDouble(c.getConfigValue())).orElse(60.0);
        double minBottomWeight = systemConfigRepository.findById("MIN_BOTTOM_WEIGHT")
                .map(c -> Double.parseDouble(c.getConfigValue())).orElse(52.0);
        double weightPerPoint = systemConfigRepository.findById("WEIGHT_PER_POINT")
                .map(c -> Double.parseDouble(c.getConfigValue())).orElse(0.5);
        double sexAllowance = systemConfigRepository.findById("SEX_ALLOWANCE")
                .map(c -> Double.parseDouble(c.getConfigValue())).orElse(1.5);

        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId); // Lấy danh sách lượt đua
        if (entries == null || entries.isEmpty()) return; // Bỏ qua nếu không có thí sinh

        // 1. Tìm chỉ số Rating lớn nhất (R_max) trong số các ngựa tham gia đã được Admin phê duyệt (APPROVED)
        int rMax = -1;
        for (RaceEntry entry : entries) {
            if ("APPROVED".equalsIgnoreCase(entry.getStatus())) {
                Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId());
                if (horseOpt.isPresent() && horseOpt.get().getCurrentRating() != null) {
                    if (horseOpt.get().getCurrentRating() > rMax) {
                        rMax = horseOpt.get().getCurrentRating(); // Cập nhật mốc Rating cao nhất
                    }
                }
            }
        }

        if (rMax == -1) {
            rMax = 52; // Mặc định R_max là 52 nếu không tìm thấy
        }

        // 2. Tính toán cân nặng cho từng chiến mã đã duyệt APPROVED
        for (RaceEntry entry : entries) {
            if ("APPROVED".equalsIgnoreCase(entry.getStatus())) {
                Optional<Horse> horseOpt = horseRepository.findById(entry.getHorseId()); // Lấy thông tin ngựa
                Optional<User> jockeyOpt = userRepository.findById(entry.getJockeyId()); // Lấy thông tin nài

                int rating = horseOpt.map(h -> h.getCurrentRating() != null ? h.getCurrentRating() : 0).orElse(0);
                String sex = horseOpt.map(Horse::getSex).orElse("Gelding");
                double handicap = maxTopWeight - (rMax - rating) * weightPerPoint; // Công thức tính trọng lượng handicap
                if ("Filly".equalsIgnoreCase(sex) || "Mare".equalsIgnoreCase(sex)) {
                    handicap -= sexAllowance; // Ưu đãi giảm cân nặng cho ngựa cái
                }
                if (handicap < minBottomWeight) {
                    handicap = minBottomWeight; // Không thấp hơn mức cân tối thiểu
                }

                double jockeyWeight = jockeyOpt.map(j -> j.getWeight() != null ? j.getWeight().doubleValue() : 50.0).orElse(50.0);
                double carried = Math.max(handicap, jockeyWeight); // Cân nặng mang theo là mức lớn hơn giữa handicap và nài

                entry.setHandicapWeight(BigDecimal.valueOf(handicap)); // Đặt handicap weight
                entry.setCarriedWeight(BigDecimal.valueOf(carried)); // Đặt carried weight
                raceEntryRepository.save(entry); // Lưu vào CSDL
            }
        }
    }

    // Tiện ích ép kiểu số nguyên từ Object
    private Integer parseInteger(Object val) {
        if (val == null) return null;
        String s = String.valueOf(val).trim();
        if (s.isEmpty() || "null".equalsIgnoreCase(s) || "undefined".equalsIgnoreCase(s)) return null;
        return Integer.parseInt(s);
    }

    // Tiện ích ép kiểu BigDecimal từ Object
    private BigDecimal parseBigDecimal(Object val) {
        if (val == null) return null;
        String s = String.valueOf(val).trim();
        if (s.isEmpty() || "null".equalsIgnoreCase(s) || "undefined".equalsIgnoreCase(s)) return null;
        return new BigDecimal(s);
    }

    // Cập nhật thông tin thẻ đua (Racecard) từ Admin
    @Transactional
    public void updateRacecard(Integer raceId, List<Map<String, Object>> body) {
        for (Map<String, Object> item : body) {
            Object idVal = item.get("entryId");
            if (idVal == null) {
                idVal = item.get("id");
            }
            Integer entryId = parseInteger(idVal); // Ép kiểu mã lượt thi đấu
            if (entryId == null) continue;

            Optional<RaceEntry> entryOpt = raceEntryRepository.findById(entryId);
            if (entryOpt.isPresent()) {
                RaceEntry entry = entryOpt.get();
                if (item.containsKey("gateNumber")) {
                    entry.setGateNumber(parseInteger(item.get("gateNumber"))); // Cập nhật số cổng
                }
                if (item.containsKey("carriedWeight")) {
                    entry.setCarriedWeight(parseBigDecimal(item.get("carriedWeight"))); // Cập nhật cân nặng mang theo
                }
                if (item.containsKey("handicapWeight")) {
                    entry.setHandicapWeight(parseBigDecimal(item.get("handicapWeight"))); // Cập nhật cân nặng handicap
                }
                raceEntryRepository.save(entry); // Lưu bản ghi
            }
        }

        // Kiểm tra tính duy nhất của cổng xuất phát
        List<RaceEntry> currentEntries = raceEntryRepository.findByRaceId(raceId);
        java.util.Set<Integer> assignedGates = new java.util.HashSet<>();
        for (RaceEntry entry : currentEntries) {
            if ("APPROVED".equalsIgnoreCase(entry.getStatus()) && entry.getGateNumber() != null && entry.getGateNumber() > 0) {
                if (!assignedGates.add(entry.getGateNumber())) {
                    throw new IllegalArgumentException("DUPLICATE_GATE_NUMBER"); // Ném ngoại lệ trùng cổng xuất phát
                }
            }
        }

        // Đổi trạng thái trận đua sang RACE_ASSIGNED nếu tất cả đã được phân cổng đầy đủ
        raceRepository.findById(raceId).ifPresent(race -> {
            if ("DECLARATION_CLOSED".equals(race.getStatus())) {
                List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
                boolean allAssigned = true;
                for (RaceEntry entry : entries) {
                    if ("APPROVED".equalsIgnoreCase(entry.getStatus()) && (entry.getGateNumber() == null || entry.getGateNumber() <= 0)) {
                        allAssigned = false;
                        break;
                    }
                }
                if (allAssigned && !entries.isEmpty()) {
                    race.setStatus("RACE_ASSIGNED"); // Cập nhật trạng thái trận đua
                    raceRepository.save(race); // Lưu trận đua
                }
            }
        });
    }

    // Phân công Trọng tài phụ trách cho Trận đua
    @Transactional
    public void assignReferee(Integer raceId, Integer refereeId) {
        Race targetRace = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        // Kiểm tra không cho phân công trọng tài khi trận đua đang chạy hoặc đã kết thúc
        if (targetRace.getStatus() != null && java.util.Arrays.asList("RUNNING", "STEWARDS_INQUIRY", "STOPPED", "OFFICIAL", "FINISHED", "CANCELLED").contains(targetRace.getStatus().toUpperCase())) {
            throw new IllegalStateException("Cannot assign referee while race is running, suspended, or completed.");
        }

        if (targetRace.getStartTime() == null) {
            throw new IllegalArgumentException("Target race does not have a start time scheduled yet.");
        }

        // 1. Check if already assigned to this race
        // 1. Check if referee is already assigned to this exact race
        // 1. Kiểm tra xem trọng tài đã được phân công cho trận đua này chưa
        List<RaceReferee> assignedToCurrentRace = raceRefereeRepository.findByRaceId(raceId);
        boolean isAlreadyAssigned = assignedToCurrentRace.stream()
                .anyMatch(rr -> rr.getRefereeId().equals(refereeId));
        if (isAlreadyAssigned) {
            throw new IllegalArgumentException("This referee is already assigned to this race.");
        }

        // 2. Check for time conflicts (overlapping races at the exact same start time, excluding cancelled races)
        // 2. Check referee schedule conflict (within 30-minute window or exact same time)
        // 2. Kiểm tra trùng lịch làm việc của trọng tài (các trận đua bắt đầu cùng thời điểm)
        List<RaceReferee> refereeAssignments = raceRefereeRepository.findByRefereeId(refereeId);
        for (RaceReferee assignment : refereeAssignments) {
            if (assignment.getRaceId().equals(raceId)) {
                continue;
            }
            Optional<Race> otherRaceOpt = raceRepository.findById(assignment.getRaceId());
            if (otherRaceOpt.isPresent()) {
                Race otherRace = otherRaceOpt.get();
                if (otherRace.getStartTime() != null) {
                    long diffMs = Math.abs(otherRace.getStartTime().getTime() - targetRace.getStartTime().getTime());
                    if (diffMs < 30 * 60 * 1000) {
                        if (!"CANCELLED".equalsIgnoreCase(otherRace.getStatus()) && !"CANCELLED".equalsIgnoreCase(targetRace.getStatus())) {
                            String formattedTime = new java.text.SimpleDateFormat("dd-MM-yyyy HH:mm:ss").format(otherRace.getStartTime());
                            throw new IllegalArgumentException("This referee has a time conflict with another race scheduled at: " + formattedTime);
                        }
                    }
                }
            }
        }

        RaceReferee rr = new RaceReferee();
        rr.setRaceId(raceId); // Đặt mã trận đua
        rr.setRefereeId(refereeId); // Đặt mã trọng tài
        raceRefereeRepository.save(rr); // Lưu phân công trọng tài vào DB
    }

    // Gỡ bỏ phân công Trọng tài khỏi Trận đua
    @Transactional
    public void removeReferee(Integer raceId, Integer refereeId) {
        // Tìm trận đua theo ID trong CSDL
        Race targetRace = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));
        // Kiểm tra không cho phép gỡ bỏ trọng tài nếu trận đua đang chạy hoặc đã kết thúc
        if (targetRace.getStatus() != null && java.util.Arrays.asList("RUNNING", "STEWARDS_INQUIRY", "STOPPED", "OFFICIAL", "FINISHED", "CANCELLED").contains(targetRace.getStatus().toUpperCase())) {
            throw new IllegalStateException("Cannot remove referee while race is running, suspended, or completed.");
        }
        // Xóa bản ghi phân công trọng tài trong DB
        raceRefereeRepository.deleteByRaceIdAndRefereeId(raceId, refereeId);
    }

    // Lấy Map danh sách Trọng tài được phân công theo từng Trận đua
    @Transactional(readOnly = true)
    public Map<Integer, List<UserDTO>> getRaceRefereesMap() {
        List<RaceReferee> allReferees = raceRefereeRepository.findAll(); // Lấy tất cả phân công trọng tài
        Map<Integer, List<UserDTO>> map = new HashMap<>(); // Khởi tạo Map kết quả
        for (RaceReferee rr : allReferees) { // Duyệt từng bản ghi phân công
            userRepository.findById(rr.getRefereeId()).ifPresent(user -> { // Tìm thông tin trọng tài
                map.computeIfAbsent(rr.getRaceId(), k -> new ArrayList<>()).add(userMapper.toDTO(user)); // Thêm DTO trọng tài vào danh sách của trận đua
            });
        }
        return map; // Trả về Map kết quả
    }

    // Hủy bỏ Trận đua (Cancel Race)
    @Transactional
    public void cancelRace(Integer raceId) {
        // Tìm trận đua trong CSDL
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));
        race.setStatus("CANCELLED"); // Chuyển trạng thái sang CANCELLED
        race.setYoutubeLiveUrl(null); // Xóa đường dẫn phát trực tiếp khi trận đua bị hủy
        raceRepository.save(race); // Lưu trận đua đã cập nhật

        // Hủy toàn bộ các lượt tham gia thi đấu của trận đua này và gửi thông báo
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        for (RaceEntry entry : entries) {
            entry.setStatus("REJECTED"); // Đổi trạng thái lượt tham gia sang REJECTED
            entry.setGateNumber(0); // Đặt lại số cổng về 0
            entry.setCarriedWeight(null); // Xóa mốc cân nặng
            entry.setHandicapWeight(null); // Xóa handicap weight
            raceEntryRepository.save(entry); // Lưu lượt thi đấu

            // Gửi thông báo hủy trận đua tới Chủ ngựa & Nài ngựa
            try {
                Horse h = horseRepository.findById(entry.getHorseId()).orElse(null);
                String hName = h != null ? h.getName() : "Horse";
                Integer ownerId = h != null ? h.getOwnerId() : null;
                notificationService.notifyPartiesOnRaceCancelled(raceId, ownerId, entry.getJockeyId(), hName);
            } catch (Exception ex) {
                System.err.println("Failed to send race cancelled notification: " + ex.getMessage());
            }
        }

        // Hoàn lại tiền Phí Thuê Nài (Hire Fee) đang tạm giữ trong Escrow về cho Chủ Ngựa
        List<RaceInvitation> invitations = invitationRepository.findByRaceId(raceId);
        for (RaceInvitation invite : invitations) {
            if ("HELD".equalsIgnoreCase(invite.getPayoutStatus()) || "ACCEPTED".equalsIgnoreCase(invite.getStatus())) {
                BigDecimal hireFee = invite.getHireFee() != null ? invite.getHireFee() : new BigDecimal("500.00");
                Integer ownerId = invite.getOwnerId();
                if (ownerId != null && hireFee.compareTo(BigDecimal.ZERO) > 0) {
                    Optional<User> ownerOpt = userRepository.findById(ownerId);
                    if (ownerOpt.isPresent()) {
                        User owner = ownerOpt.get();
                        BigDecimal cur = owner.getWalletBalance() != null ? owner.getWalletBalance() : BigDecimal.ZERO;
                        owner.setWalletBalance(cur.add(hireFee));
                        userRepository.save(owner);

                        WalletTransaction txRefund = new WalletTransaction();
                        txRefund.setUserId(owner.getId());
                        txRefund.setAmount(hireFee);
                        txRefund.setTransactionType("INVITATION_CANCELLED_REFUND");
                        txRefund.setDescription("Refund jockey hire fee due to cancelled race #" + raceId);
                        txRefund.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
                        walletTransactionRepository.save(txRefund);
                    }
                }
                invite.setPayoutStatus("REFUNDED");
                invite.setStatus("REJECTED");
                invitationRepository.save(invite);
            }
        }
    }

    // Đóng sự kiện trận đua sau khi kết quả chính thức (OFFICIAL → RACE_EVENT_ENDED)
    // Giải phóng Ngựa và Nài khỏi ràng buộc trận đua
    @Transactional
    public void closeRace(Integer raceId) {
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found with id: " + raceId));

        // Chỉ cho phép đóng khi đang ở trạng thái OFFICIAL
        if (!"OFFICIAL".equalsIgnoreCase(race.getStatus())) {
            throw new IllegalStateException("Race can only be closed when it is in OFFICIAL status. Current status: " + race.getStatus());
        }

        // Chuyển trạng thái trận đua sang RACE_EVENT_ENDED
        race.setStatus("RACE_EVENT_ENDED");
        raceRepository.save(race);

        // Giải phóng các lượt tham gia sang FINISHED để ngựa & nài được tự do
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        for (RaceEntry entry : entries) {
            // Chỉ cập nhật những entry chưa bị REJECTED/DISQUALIFIED
            String st = entry.getStatus();
            if (!"REJECTED".equalsIgnoreCase(st) && !"DISQUALIFIED".equalsIgnoreCase(st)) {
                if (!"FINISHED".equalsIgnoreCase(st)) {
                    entry.setStatus("FINISHED");
                    raceEntryRepository.save(entry);
                }
            }

            // Gửi thông báo hoàn tất sự kiện tới Chủ ngựa & Nài ngựa
            try {
                Horse h = horseRepository.findById(entry.getHorseId()).orElse(null);
                Integer ownerId = h != null ? h.getOwnerId() : null;
                String horseName = h != null ? h.getName() : "Horse";
                if (ownerId != null) {
                    notificationService.createNotification(ownerId,
                        "Race Event Closed",
                        "Race #" + raceId + " has been officially closed. Horse '" + horseName + "' is now free.");
                }
                if (entry.getJockeyId() != null) {
                    notificationService.createNotification(entry.getJockeyId(),
                        "Race Event Closed",
                        "Race #" + raceId + " has been officially closed. You are now free for new race assignments.");
                }
            } catch (Exception ex) {
                System.err.println("Failed to send race closed notification: " + ex.getMessage());
            }
        }

        // Kiểm tra nếu tất cả trận đua trong Buổi đua đã đóng sự kiện (RACE_EVENT_ENDED/CANCELLED) -> Hoàn tất Buổi đua (ENDED)
        if (race.getRaceMeetingId() != null) {
            List<Race> meetingRaces = raceRepository.findByRaceMeetingId(race.getRaceMeetingId());
            boolean allEnded = meetingRaces.stream().allMatch(r -> 
                "RACE_EVENT_ENDED".equalsIgnoreCase(r.getStatus()) || 
                "CANCELLED".equalsIgnoreCase(r.getStatus())
            );
            if (allEnded) {
                raceMeetingRepository.findById(race.getRaceMeetingId()).ifPresent(m -> {
                    m.setStatus("ENDED");
                    raceMeetingRepository.save(m);
                });
            }
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getUserDetailsCategorized(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Map<String, Object> res = new HashMap<>();
        res.put("user", userMapper.toDTO(user));

        // Owned Horses (for Owner role_id = 2 or all users)
        List<Horse> ownedHorses = horseRepository.findByOwnerId(userId);
        res.put("ownedHorses", ownedHorses.stream().map(horseMapper::toDTO).collect(Collectors.toList()));

        // Jockey Mounts (for Jockey role_id = 3)
        List<RaceEntry> mounts = raceEntryRepository.findByJockeyId(userId);
        res.put("jockeyMounts", mounts.stream().map(raceEntryMapper::toDTO).collect(Collectors.toList()));

        // Referee Assignments (for Referee role_id = 5)
        List<RaceReferee> refereeAssignments = raceRefereeRepository.findByRefereeId(userId);
        res.put("refereeAssignments", refereeAssignments);

        // Race Invitations & Commission Share
        List<RaceInvitation> invitations = invitationRepository.findAll().stream()
                .filter(i -> userId.equals(i.getOwnerId()) || userId.equals(i.getJockeyId()))
                .collect(Collectors.toList());
        res.put("invitations", invitations);

        BigDecimal totalCommission = invitations.stream()
                .filter(i -> "ACCEPTED".equalsIgnoreCase(i.getStatus()) || "PAID".equalsIgnoreCase(i.getPayoutStatus()))
                .map(i -> i.getCommissionAmount() != null ? i.getCommissionAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        res.put("totalCommission", totalCommission);

        return res;
    }

    @Transactional
    public UserDTO depositWalletBalance(Integer userId, BigDecimal amount) {
        return adjustWalletBalance(userId, amount, false);
    }

    @Transactional
    public UserDTO adjustWalletBalance(Integer userId, BigDecimal amount, boolean setMode) {
        if (amount == null) {
            throw new IllegalArgumentException("Amount cannot be null");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));
        if (setMode) {
            user.setWalletBalance(amount);
        } else {
            BigDecimal current = user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO;
            user.setWalletBalance(current.add(amount));
        }
        User saved = userRepository.save(user);
        return userMapper.toDTO(saved);
    }

    // Lấy thông tin Ví Admin và lịch sử giao dịch
    @Transactional(readOnly = true)
    public Map<String, Object> getAdminWalletInfo() {
        User admin = userRepository.findAll().stream()
                .filter(u -> u.getRoleId() != null && u.getRoleId() == 1)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

        BigDecimal balance = admin.getWalletBalance() != null ? admin.getWalletBalance() : BigDecimal.ZERO;
        List<WalletTransaction> txs = walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(admin.getId());

        Map<String, Object> res = new HashMap<>();
        res.put("adminId", admin.getId());
        res.put("username", admin.getUsername());
        res.put("walletBalance", balance);
        res.put("transactions", txs);
        return res;
    }

    // Lấy thông tin Ví và nhật ký giao dịch của bất kỳ người dùng nào (Jockey / Owner / Admin)
    @Transactional(readOnly = true)
    public Map<String, Object> getUserWalletInfo(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + userId));

        BigDecimal balance = user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO;
        List<WalletTransaction> txs = walletTransactionRepository.findByUserIdOrderByCreatedAtDesc(userId);

        Map<String, Object> res = new HashMap<>();
        res.put("userId", user.getId());
        res.put("username", user.getUsername());
        res.put("walletBalance", balance);
        res.put("transactions", txs);
        return res;
    }

    // Nạp tiền vào Ví Admin (Admin Top-Up)
    @Transactional
    public Map<String, Object> topUpAdminWallet(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Top-up amount must be greater than 0");
        }

        User admin = userRepository.findAll().stream()
                .filter(u -> u.getRoleId() != null && u.getRoleId() == 1)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

        BigDecimal curBal = admin.getWalletBalance() != null ? admin.getWalletBalance() : BigDecimal.ZERO;
        BigDecimal newBal = curBal.add(amount);
        admin.setWalletBalance(newBal);
        userRepository.save(admin);

        WalletTransaction tx = new WalletTransaction();
        tx.setUserId(admin.getId());
        tx.setAmount(amount);
        tx.setTransactionType("ADMIN_TOPUP");
        tx.setDescription("Direct Top-up into Admin Wallet funding source");
        tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        walletTransactionRepository.save(tx);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("newBalance", newBal);
        res.put("message", "Top-up of $" + amount + " successful.");
        return res;
    }

    // Rút tiền khỏi Ví Admin (Admin Withdrawal with transaction log)
    @Transactional
    public Map<String, Object> withdrawAdminWallet(BigDecimal amount, String notes) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Withdrawal amount must be greater than 0");
        }

        User admin = userRepository.findAll().stream()
                .filter(u -> u.getRoleId() != null && u.getRoleId() == 1)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

        BigDecimal curBal = admin.getWalletBalance() != null ? admin.getWalletBalance() : BigDecimal.ZERO;
        if (curBal.compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient Admin wallet balance (" + curBal + " VNĐ) for withdrawal of " + amount + " VNĐ");
        }

        BigDecimal newBal = curBal.subtract(amount);
        admin.setWalletBalance(newBal);
        userRepository.save(admin);

        WalletTransaction tx = new WalletTransaction();
        tx.setUserId(admin.getId());
        tx.setAmount(amount.negate());
        tx.setTransactionType("ADMIN_WITHDRAWAL");
        tx.setDescription("Admin Withdrawal out of system: " + (notes != null && !notes.trim().isEmpty() ? notes.trim() : "Standard withdrawal"));
        tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        walletTransactionRepository.save(tx);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("newBalance", newBal);
        res.put("message", "Withdrawal of $" + amount + " logged and executed successfully.");
        return res;
    }

    // Quyết toán doanh thu bán vé từ Quỹ Tạm Giữ của RaceMeeting vào Ví Admin
    @Transactional
    public Map<String, Object> settleMeetingTicketRevenue(Integer meetingId) {
        RaceMeeting meeting = raceMeetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Race meeting not found with id: " + meetingId));

        if (Boolean.TRUE.equals(meeting.getTicketSettled())) {
            Map<String, Object> res = new HashMap<>();
            res.put("success", true);
            res.put("settledAmount", BigDecimal.ZERO);
            res.put("message", "Ticket revenue for this meeting has already been settled to Admin wallet.");
            return res;
        }

        BigDecimal ticketPrice = meeting.getTicketPrice() != null ? meeting.getTicketPrice() : BigDecimal.ZERO;
        List<OwnerRaceMeetingRegistration> approvedRegs = ownerRegRepository.findByRaceMeetingId(meetingId).stream()
                .filter(r -> "APPROVED".equalsIgnoreCase(r.getStatus()))
                .collect(Collectors.toList());

        BigDecimal totalRevenue = ticketPrice.multiply(new BigDecimal(approvedRegs.size()));

        if (totalRevenue.compareTo(BigDecimal.ZERO) > 0) {
            User admin = userRepository.findAll().stream()
                    .filter(u -> u.getRoleId() != null && u.getRoleId() == 1)
                    .findFirst().orElseThrow(() -> new IllegalArgumentException("Admin user not found"));

            BigDecimal curBal = admin.getWalletBalance() != null ? admin.getWalletBalance() : BigDecimal.ZERO;
            admin.setWalletBalance(curBal.add(totalRevenue));
            userRepository.save(admin);

            WalletTransaction tx = new WalletTransaction();
            tx.setUserId(admin.getId());
            tx.setAmount(totalRevenue);
            tx.setTransactionType("TICKET_INCOME_SETTLEMENT");
            tx.setDescription("Auto-settled ticket revenue for Race Meeting '" + meeting.getName() + "' (" + approvedRegs.size() + " approved tickets)");
            tx.setRaceMeetingId(meetingId);
            tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
            walletTransactionRepository.save(tx);
        }

        meeting.setTicketSettled(true);
        raceMeetingRepository.save(meeting);

        Map<String, Object> res = new HashMap<>();
        res.put("success", true);
        res.put("settledAmount", totalRevenue);
        res.put("approvedTickets", approvedRegs.size());
        res.put("message", "Ticket revenue of $" + totalRevenue + " successfully settled into Admin wallet.");
        return res;
    }

    // Đổi trạng thái RaceMeeting (ACTIVE <-> INACTIVE)
    @Transactional
    public String toggleMeetingStatus(Integer meetingId) {
        RaceMeeting meeting = raceMeetingRepository.findById(meetingId)
                .orElseThrow(() -> new IllegalArgumentException("Race meeting not found with id: " + meetingId));

        String prevStatus = meeting.getStatus() != null ? meeting.getStatus() : "ACTIVE";
        String nextStatus = "ACTIVE".equalsIgnoreCase(prevStatus) ? "INACTIVE" : "ACTIVE";

        if ("ACTIVE".equalsIgnoreCase(nextStatus)) {
            Season season = seasonRepository.findById(meeting.getSeasonId()).orElse(null);
            if (season != null && ("CLOSED".equalsIgnoreCase(season.getStatus()) || "INACTIVE".equalsIgnoreCase(season.getStatus()))) {
                throw new IllegalStateException("Cannot activate Race Meeting because its parent Season ('" + season.getName() + "') is currently " + season.getStatus() + ". Please activate the Season first.");
            }
        }

        // Tìm tài khoản Admin
        User admin = userRepository.findAll().stream()
                .filter(u -> u.getRoleId() != null && u.getRoleId() == 1)
                .findFirst().orElse(null);

        BigDecimal budget = meeting.getTotalBudget() != null ? meeting.getTotalBudget() : BigDecimal.ZERO;

        if ("INACTIVE".equalsIgnoreCase(nextStatus) && !"INACTIVE".equalsIgnoreCase(prevStatus)) {
            // Khi deactive -> Chỉ hoàn phần tiền ngân sách CHƯA SỬ DỤNG (chưa trao giải) về Ví Admin
            List<Race> mRacesForBudget = raceRepository.findByRaceMeetingId(meeting.getId());
            BigDecimal totalAwardedPurses = mRacesForBudget.stream()
                    .map(r -> raceEntryRepository.findByRaceId(r.getId()))
                    .flatMap(List::stream)
                    .map(e -> e.getPrizeMoney() != null ? e.getPrizeMoney() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            BigDecimal curTotalBudget = meeting.getTotalBudget() != null ? meeting.getTotalBudget() : BigDecimal.ZERO;
            BigDecimal unspentBudgetToRefund = curTotalBudget.subtract(totalAwardedPurses);
            if (unspentBudgetToRefund.compareTo(BigDecimal.ZERO) < 0) {
                unspentBudgetToRefund = BigDecimal.ZERO;
            }

            meeting.setLastAllocatedBudget(unspentBudgetToRefund); // Lưu lại đúng số tiền ngân sách chưa dùng để khôi phục khi Re-active

            if (admin != null && unspentBudgetToRefund.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal adminBal = admin.getWalletBalance() != null ? admin.getWalletBalance() : BigDecimal.ZERO;
                admin.setWalletBalance(adminBal.add(unspentBudgetToRefund));
                userRepository.save(admin);

                WalletTransaction tx = new WalletTransaction();
                tx.setUserId(admin.getId());
                tx.setAmount(unspentBudgetToRefund);
                tx.setTransactionType("MEETING_BUDGET_REFUND");
                tx.setDescription("Unspent budget refund (" + unspentBudgetToRefund + " VNĐ) to Admin Wallet due to Deactivation of Race Meeting '" + meeting.getName() + "'");
                tx.setRaceMeetingId(meeting.getId());
                tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                walletTransactionRepository.save(tx);
            }

            // Đặt totalBudget của RaceMeeting bằng đúng số tiền đã chi trả thưởng thực tế
            meeting.setTotalBudget(totalAwardedPurses);

            // Hoàn tiền vé đăng ký cho Horse Owner từ Escrow Vault & reset lượt đăng ký
            BigDecimal ticketPrice = meeting.getTicketPrice() != null ? meeting.getTicketPrice() : BigDecimal.ZERO;
            if (ticketPrice.compareTo(BigDecimal.ZERO) > 0) {
                List<OwnerRaceMeetingRegistration> ownerRegs = ownerRegRepository.findByRaceMeetingId(meeting.getId());
                for (OwnerRaceMeetingRegistration reg : ownerRegs) {
                    if (!"REJECTED".equalsIgnoreCase(reg.getStatus()) && reg.getOwnerId() != null) {
                        userRepository.findById(reg.getOwnerId()).ifPresent(owner -> {
                            BigDecimal ownerBal = owner.getWalletBalance() != null ? owner.getWalletBalance() : BigDecimal.ZERO;
                            owner.setWalletBalance(ownerBal.add(ticketPrice));
                            userRepository.save(owner);

                            WalletTransaction txOwner = new WalletTransaction();
                            txOwner.setUserId(owner.getId());
                            txOwner.setAmount(ticketPrice);
                            txOwner.setTransactionType("TICKET_REFUND");
                            txOwner.setDescription("Ticket fee refund from Escrow Vault due to Race Meeting Deactivation (" + meeting.getName() + ")");
                            txOwner.setRaceMeetingId(meeting.getId());
                            txOwner.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                            walletTransactionRepository.save(txOwner);
                        });
                    }
                    reg.setStatus("REJECTED");
                    ownerRegRepository.save(reg);
                }
            }

            // Hoàn lại tiền cọc thuê nài (Hire Fee) cho Owner đối với các TRẬN CHƯA THI ĐẤU khi Deactive RaceMeeting
            List<Race> mRaces = raceRepository.findByRaceMeetingId(meeting.getId());
            for (Race r : mRaces) {
                boolean isRaceFinished = "OFFICIAL".equalsIgnoreCase(r.getStatus()) || 
                                         "RACE_EVENT_ENDED".equalsIgnoreCase(r.getStatus()) || 
                                         "FINISHED".equalsIgnoreCase(r.getStatus());
                if (isRaceFinished) {
                    continue; // Trận đua đã hoàn thành thi đấu -> Giữ nguyên tiền thuê Nài (Jockey Hire Fee) cho Nài ngựa, không thu hồi!
                }

                List<RaceInvitation> invs = invitationRepository.findByRaceId(r.getId());
                for (RaceInvitation inv : invs) {
                    if (!"REFUNDED".equalsIgnoreCase(inv.getPayoutStatus()) && inv.getOwnerId() != null) {
                        BigDecimal hireFee = inv.getHireFee() != null ? inv.getHireFee() : new BigDecimal("500.00");
                        boolean wasHeldOrPaid = "HELD".equalsIgnoreCase(inv.getPayoutStatus()) || "PAID".equalsIgnoreCase(inv.getPayoutStatus());
                        if (hireFee.compareTo(BigDecimal.ZERO) > 0 && wasHeldOrPaid) {
                            // Hoàn lại 100% tiền cọc thuê nài về ví của Owner đối với trận chưa đua
                            userRepository.findById(inv.getOwnerId()).ifPresent(owner -> {
                                BigDecimal ownerBal = owner.getWalletBalance() != null ? owner.getWalletBalance() : BigDecimal.ZERO;
                                owner.setWalletBalance(ownerBal.add(hireFee));
                                userRepository.save(owner);

                                WalletTransaction txHire = new WalletTransaction();
                                txHire.setUserId(owner.getId());
                                txHire.setAmount(hireFee);
                                txHire.setTransactionType("JOCKEY_HIRE_REFUND");
                                txHire.setDescription("Jockey hire fee refund due to Race Meeting Deactivation (" + meeting.getName() + ")");
                                txHire.setRaceMeetingId(meeting.getId());
                                txHire.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                                walletTransactionRepository.save(txHire);
                            });
                        }
                        inv.setPayoutStatus("REFUNDED");
                        inv.setStatus("REJECTED");
                        invitationRepository.save(inv);
                    }
                }
            }

            // Reset danh sách đăng ký kỵ sĩ, chiến mã và các lượt đua chưa thi đấu
            List<JockeyRaceMeetingRegistration> jockeyRegs = jockeyRegRepository.findByRaceMeetingId(meeting.getId());
            for (JockeyRaceMeetingRegistration jReg : jockeyRegs) {
                jReg.setStatus("REJECTED");
                jockeyRegRepository.save(jReg);
            }
            List<HorseRaceMeetingRegistration> horseRegs = horseRegRepository.findByRaceMeetingId(meeting.getId());
            for (HorseRaceMeetingRegistration hReg : horseRegs) {
                hReg.setStatus("REJECTED");
                horseRegRepository.save(hReg);
            }
            for (Race r : mRaces) {
                boolean isRaceFinished = "OFFICIAL".equalsIgnoreCase(r.getStatus()) || 
                                         "RACE_EVENT_ENDED".equalsIgnoreCase(r.getStatus()) || 
                                         "FINISHED".equalsIgnoreCase(r.getStatus());
                if (!isRaceFinished) {
                    r.setStatus("DECLARATION_OPEN");
                    raceRepository.save(r);
                    List<RaceEntry> entries = raceEntryRepository.findByRaceId(r.getId());
                    for (RaceEntry entry : entries) {
                        if (!"FINISHED".equalsIgnoreCase(entry.getStatus()) && !"OFFICIAL".equalsIgnoreCase(entry.getStatus())) {
                            entry.setStatus("REJECTED");
                            entry.setGateNumber(0);
                            entry.setCarriedWeight(BigDecimal.ZERO);
                            entry.setHandicapWeight(BigDecimal.ZERO);
                            raceEntryRepository.save(entry);
                        }
                    }
                }
            }
        } else if ("ACTIVE".equalsIgnoreCase(nextStatus) && ("INACTIVE".equalsIgnoreCase(prevStatus) || "ENDED".equalsIgnoreCase(prevStatus))) {
            // Khi active trở lại -> Trừ tiền từ Admin Wallet cấp lại phần ngân sách chưa dùng ($lastAllocatedBudget) cho Race Meeting
            BigDecimal budgetToRestore = meeting.getLastAllocatedBudget() != null ? meeting.getLastAllocatedBudget() : BigDecimal.ZERO;

            if (admin != null && budgetToRestore.compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal adminBal = admin.getWalletBalance() != null ? admin.getWalletBalance() : BigDecimal.ZERO;
                if (adminBal.compareTo(budgetToRestore) < 0) {
                    throw new IllegalArgumentException(String.format("Admin wallet balance (%,.0f VNĐ) is insufficient to re-allocate unspent budget (%,.0f VNĐ) for Race Meeting.", adminBal, budgetToRestore));
                }
                admin.setWalletBalance(adminBal.subtract(budgetToRestore));
                userRepository.save(admin);

                WalletTransaction tx = new WalletTransaction();
                tx.setUserId(admin.getId());
                tx.setAmount(budgetToRestore.negate());
                tx.setTransactionType("MEETING_BUDGET_ALLOCATION");
                tx.setDescription("Re-allocated unspent budget (" + budgetToRestore + " VNĐ) for Race Meeting: " + meeting.getName());
                tx.setRaceMeetingId(meeting.getId());
                tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                walletTransactionRepository.save(tx);
            }
            // Khôi phục ngân sách cho RaceMeeting = số tiền đã chi trả thưởng thực tế + ngân sách khôi phục
            BigDecimal totalAwardedPurses = raceRepository.findByRaceMeetingId(meeting.getId()).stream()
                    .map(r -> raceEntryRepository.findByRaceId(r.getId()))
                    .flatMap(List::stream)
                    .map(e -> e.getPrizeMoney() != null ? e.getPrizeMoney() : BigDecimal.ZERO)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            meeting.setTotalBudget(totalAwardedPurses.add(budgetToRestore));
            meeting.setLastAllocatedBudget(BigDecimal.ZERO);

            // Dọn dẹp trạng thái đăng ký REJECTED cũ do deactive gây ra để các Chủ ngựa/Nài ngựa thấy lại sự kiện trên Calendar & Dashboard
            List<OwnerRaceMeetingRegistration> staleOwnerRegs = ownerRegRepository.findByRaceMeetingId(meeting.getId());
            for (OwnerRaceMeetingRegistration oReg : staleOwnerRegs) {
                if ("REJECTED".equalsIgnoreCase(oReg.getStatus())) {
                    ownerRegRepository.delete(oReg);
                }
            }
        }

        meeting.setStatus(nextStatus);
        raceMeetingRepository.save(meeting);
        return nextStatus;
    }

    // Tra cứu danh sách lịch sử biến động tiền vé của riêng một Buổi đua
    @Transactional(readOnly = true)
    public List<WalletTransaction> getMeetingTransactions(Integer meetingId) {
        return walletTransactionRepository.findByRaceMeetingIdOrderByIdDesc(meetingId);
    }
}


