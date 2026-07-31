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

    private final RaceEntryMapper raceEntryMapper;
    private final HorseMapper horseMapper;
    private final RegistrationMapper registrationMapper;
    private final UserMapper userMapper;

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
            map.put("meeting", meeting != null ? RaceMeetingDTO.builder().id(meeting.getId()).name(meeting.getName()).build() : null);
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
            map.put("meeting", meeting != null ? RaceMeetingDTO.builder().id(meeting.getId()).name(meeting.getName()).build() : null);
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

        autoAssignGates(entry.getRaceId()); // Tự động xáo trộn và gán cổng xuất phát cho các thí sinh đã duyệt
        autoCalculateWeights(entry.getRaceId()); // Tự động tính toán cân nặng handicap và cân mang thực tế
    }

    // Từ chối lượt đăng ký thi đấu của ngựa/nài trong trận đua
    @Transactional
    public void rejectRaceEntry(Integer id) {
        // Tìm lượt đăng ký theo ID trong CSDL
        RaceEntry entry = raceEntryRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Race entry not found"));
        entry.setStatus("REJECTED"); // Cập nhật trạng thái sang REJECTED
        raceEntryRepository.save(entry); // Lưu đối tượng bị từ chối vào DB

        // Đặt trạng thái lời mời tương ứng sang REJECTED để giải phóng nài ngựa nhận lời mời khác
        invitationRepository.findByJockeyIdAndRaceIdAndHorseId(entry.getJockeyId(), entry.getRaceId(), entry.getHorseId())
                .stream()
                .filter(i -> "ACCEPTED".equalsIgnoreCase(i.getStatus()))
                .forEach(i -> {
                    i.setStatus("REJECTED"); // Đổi trạng thái lời mời thành REJECTED
                    invitationRepository.save(i); // Lưu lời mời đã cập nhật vào DB
                });

        autoCalculateWeights(entry.getRaceId()); // Tính toán lại cân nặng của các lượt đua còn lại
    }

    // Phê duyệt đăng ký Nài ngựa tham gia Ngày hội đua
    @Transactional
    public void approveJockeyReg(Integer id) {
        JockeyRaceMeetingRegistration reg = jockeyRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("APPROVED"); // Cập nhật trạng thái sang APPROVED
        jockeyRegRepository.save(reg); // Lưu vào DB
    }

    // Từ chối đăng ký Nài ngựa tham gia Ngày hội đua
    @Transactional
    public void rejectJockeyReg(Integer id) {
        JockeyRaceMeetingRegistration reg = jockeyRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("REJECTED"); // Cập nhật trạng thái sang REJECTED
        jockeyRegRepository.save(reg); // Lưu vào DB
    }

    // Phê duyệt đăng ký Chủ ngựa tham gia Ngày hội đua
    @Transactional
    public void approveOwnerReg(Integer id) {
        OwnerRaceMeetingRegistration reg = ownerRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("APPROVED"); // Cập nhật trạng thái sang APPROVED
        ownerRegRepository.save(reg); // Lưu vào DB
    }

    // Từ chối đăng ký Chủ ngựa tham gia Ngày hội đua
    @Transactional
    public void rejectOwnerReg(Integer id) {
        OwnerRaceMeetingRegistration reg = ownerRegRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Registration not found"));
        reg.setStatus("REJECTED"); // Cập nhật trạng thái sang REJECTED
        ownerRegRepository.save(reg); // Lưu vào DB
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
    }

    // Từ chối hồ sơ chiến mã mới đăng ký vào hệ thống
    @Transactional
    public void rejectSystemHorse(Integer id) {
        Horse horse = horseRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Horse not found"));
        horse.setStatus("REJECTED"); // Từ chối trạng thái REJECTED
        horseRepository.save(horse); // Lưu vào DB
    }

    // Tự động phân bổ cổng xuất phát (Gate Assignment) ngẫu nhiên cho các thí sinh đã duyệt
    @Transactional
    public void autoAssignGates(Integer raceId) {
        if (raceId == null) return; // Nếu mã trận đua bị null thì kết thúc
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId); // Lấy danh sách thí sinh đăng ký
        List<RaceEntry> approvedEntries = entries.stream()
                .filter(e -> "APPROVED".equalsIgnoreCase(e.getStatus()))
                .toList(); // Lọc danh sách các thí sinh đã được duyệt

        int count = approvedEntries.size(); // Số lượng thí sinh đã được duyệt
        List<Integer> gates = new ArrayList<>(); // Khởi tạo danh sách vị trí cổng xuất phát
        for (int i = 1; i <= Math.min(count, 12); i++) {
            gates.add(i); // Đưa các số cổng từ 1 đến tối đa 12 vào danh sách
        }
        Collections.shuffle(gates); // Xáo trộn ngẫu nhiên thứ tự các cổng xuất phát

        for (int i = 0; i < approvedEntries.size(); i++) {
            RaceEntry entry = approvedEntries.get(i);
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

        // 1. Tìm chỉ số Rating lớn nhất (R_max) trong số các ngựa tham gia
        int rMax = -1;
        for (RaceEntry entry : entries) {
            if ("APPROVED".equalsIgnoreCase(entry.getStatus()) || "PENDING_ADMIN".equalsIgnoreCase(entry.getStatus())) {
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

        // 2. Tính toán cân nặng cho từng chiến mã
        for (RaceEntry entry : entries) {
            if ("APPROVED".equalsIgnoreCase(entry.getStatus()) || "PENDING_ADMIN".equalsIgnoreCase(entry.getStatus())) {
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

        // 1. Kiểm tra xem trọng tài đã được phân công cho trận đua này chưa
        List<RaceReferee> assignedToCurrentRace = raceRefereeRepository.findByRaceId(raceId);
        boolean isAlreadyAssigned = assignedToCurrentRace.stream()
                .anyMatch(rr -> rr.getRefereeId().equals(refereeId));
        if (isAlreadyAssigned) {
            throw new IllegalArgumentException("Referee is already assigned to this race.");
        }

        // 2. Kiểm tra trùng lịch làm việc của trọng tài (các trận đua bắt đầu cùng thời điểm)
        List<RaceReferee> refereeAssignments = raceRefereeRepository.findByRefereeId(refereeId);
        for (RaceReferee assignment : refereeAssignments) {
            if (assignment.getRaceId().equals(raceId)) {
                continue;
            }
            Optional<Race> otherRaceOpt = raceRepository.findById(assignment.getRaceId());
            if (otherRaceOpt.isPresent()) {
                Race otherRace = otherRaceOpt.get();
                if (otherRace.getStartTime() != null && otherRace.getStartTime().equals(targetRace.getStartTime())) {
                    if (!"CANCELLED".equalsIgnoreCase(otherRace.getStatus()) && !"CANCELLED".equalsIgnoreCase(targetRace.getStatus())) {
                        throw new IllegalArgumentException("Referee is already assigned to another race starting at the exact same time (" 
                                + new java.text.SimpleDateFormat("dd-MM-yyyy HH:mm:ss").format(targetRace.getStartTime()) + ").");
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

        // Hủy toàn bộ các lượt tham gia thi đấu của trận đua này
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        for (RaceEntry entry : entries) {
            entry.setStatus("REJECTED"); // Đổi trạng thái lượt tham gia sang REJECTED
            entry.setGateNumber(0); // Đặt lại số cổng về 0
            entry.setCarriedWeight(null); // Xóa mốc cân nặng
            entry.setHandicapWeight(null); // Xóa handicap weight
            raceEntryRepository.save(entry); // Lưu lượt thi đấu
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
}
