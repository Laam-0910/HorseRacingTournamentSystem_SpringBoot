package com.horseracing.backend.controller;

import com.horseracing.backend.entity.*;
import com.horseracing.backend.repository.*;
import com.horseracing.backend.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Controller PublicDataController - Lớp kiểm soát các endpoint cung cấp dữ liệu công khai và thống kê hiệu suất.
 * - Cho phép người xem/khách (không cần đăng nhập) tra cứu lịch trình đua, kết quả xếp hạng.
 * - Lấy thống kê tổng quan toàn hệ thống (mùa giải hoàn tất, tổng giải thưởng đã trao, số ngựa hoạt động...).
 * - Tra cứu hồ sơ chi tiết công khai của kỵ sĩ, chủ ngựa, trọng tài, admin.
 * - Xem chi tiết biểu đồ phong độ và lịch sử thi đấu của một chiến mã cụ thể.
 */
@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*") // Hỗ trợ CORS
public class PublicDataController {

    @Autowired
    private SeasonRepository seasonRepository;

    @Autowired
    private RaceRepository raceRepository;

    @Autowired
    private RaceEntryRepository raceEntryRepository;

    @Autowired
    private HorseRepository horseRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RaceMeetingRepository raceMeetingRepository;

    @Autowired
    private ViolationRepository violationRepository;

    @Autowired
    private RaceRefereeRepository raceRefereeRepository;

    @Autowired
    private WalletTransactionRepository walletTransactionRepository;

    @Autowired
    private WithdrawalRequestRepository withdrawalRequestRepository;

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private ChatMessageRepository chatMessageRepository;

    @Autowired
    private NotificationService notificationService;

    // Lấy danh sách tin nhắn chat công khai theo raceId
    @GetMapping("/chat/{raceId}")
    public ResponseEntity<?> getRaceChatMessages(@PathVariable Integer raceId) {
        List<ChatMessage> list = chatMessageRepository.findByRaceIdOrderBySentAtAsc(raceId);
        List<Map<String, String>> result = new ArrayList<>();
        for (ChatMessage msg : list) {
            Map<String, String> m = new HashMap<>();
            m.put("user", msg.getUsername());
            m.put("text", msg.getMessageText());
            m.put("time", msg.getSentAt() != null ? new java.text.SimpleDateFormat("HH:mm").format(msg.getSentAt()) : "");
            result.add(m);
        }
        return ResponseEntity.ok(result);
    }

    // Gửi tin nhắn chat công khai mới
    @PostMapping("/chat/send")
    public ResponseEntity<?> sendRaceChatMessage(@RequestBody Map<String, Object> req) {
        try {
            Integer raceId = Integer.parseInt(req.get("raceId").toString());
            String user = req.get("user") != null ? req.get("user").toString() : "Guest";
            String text = req.get("text") != null ? req.get("text").toString() : "";

            if (!text.trim().isEmpty()) {
                ChatMessage chatMessage = new ChatMessage();
                chatMessage.setRaceId(raceId);
                chatMessage.setUsername(user);
                chatMessage.setMessageText(text.trim());
                chatMessage.setSentAt(new java.sql.Timestamp(System.currentTimeMillis()));
                chatMessageRepository.save(chatMessage);
            }
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Lấy danh sách Trọng tài được phân công theo từng cuộc đua (Công khai)
    @GetMapping("/races/referees")
    public ResponseEntity<?> getPublicRaceReferees() {
        List<RaceReferee> allReferees = raceRefereeRepository.findAll();
        Map<Integer, User> userMap = userRepository.findAll().stream().collect(java.util.stream.Collectors.toMap(User::getId, u -> u, (a, b) -> a));
        Map<Integer, List<Map<String, Object>>> map = new HashMap<>();
        for (RaceReferee rr : allReferees) {
            User u = userMap.get(rr.getRefereeId());
            if (u != null) {
                Map<String, Object> uMap = new HashMap<>();
                uMap.put("id", u.getId());
                uMap.put("username", u.getUsername());
                uMap.put("fullName", u.getFullName() != null && !u.getFullName().isBlank() ? u.getFullName() : u.getUsername());
                uMap.put("avatar", u.getAvatar());
                map.computeIfAbsent(rr.getRaceId(), k -> new ArrayList<>()).add(uMap);
            }
        }
        return ResponseEntity.ok(map);
    }

    // ... (rest of endpoints) ...

    // Lấy thống kê tổng hợp toàn hệ thống
    @GetMapping("/stats")
        public ResponseEntity<?> getStats() {
        // Đếm số mùa giải đã hoàn tất
        long seasonsCompleted = seasonRepository.findAll().stream().filter(s -> "COMPLETED".equals(s.getStatus())).count();
        // Đếm số trận đua chính thức (trọng tài đã xác nhận kết quả)
        long totalRacesRun = raceRepository.findAll().stream().filter(r -> "OFFICIAL".equals(r.getStatus())).count();
        
        // Cộng tổng số tiền thưởng lũy kế đã phân bổ cho nài ngựa và chủ ngựa
        BigDecimal totalPrizeDistributed = raceEntryRepository.findAll().stream()
                .map(RaceEntry::getPrizeMoney)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // Lấy số lượng ngựa ACTIVE và nài ngựa ACTIVE
        long totalActiveHorses = horseRepository.findByStatus("ACTIVE").size();
        long totalActiveJockeys = userRepository.findByRoleId(3).stream().filter(u -> "ACTIVE".equals(u.getStatus())).count();

        // Lấy tên mùa giải đang hoạt động hiện tại
        String activeSeason = seasonRepository.findAll().stream()
                .filter(s -> "ACTIVE".equals(s.getStatus()))
                .map(Season::getName)
                .findFirst()
                .orElse("No Active Season");

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeSeason", activeSeason);
        stats.put("seasonsCompleted", seasonsCompleted);
        stats.put("totalRacesRun", totalRacesRun);
        stats.put("totalPrizeDistributed", totalPrizeDistributed);
        stats.put("totalActiveHorses", totalActiveHorses);
        stats.put("totalActiveJockeys", totalActiveJockeys);

        return ResponseEntity.ok(stats);
    }

    // Lấy bảng xếp hạng vị trí cán đích chính thức của cuộc đua
    @GetMapping("/results")
    public ResponseEntity<?> getResults(@RequestParam Integer raceId) {
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        
        // Khử trùng lặp theo horseId và bỏ qua các bản ghi REJECTED
        Map<Integer, RaceEntry> uniqueMap = new LinkedHashMap<>();
        for (RaceEntry entry : entries) {
            if (!"REJECTED".equalsIgnoreCase(entry.getStatus())) {
                uniqueMap.putIfAbsent(entry.getHorseId(), entry);
            }
        }

        List<Map<String, Object>> results = new ArrayList<>();
        for (RaceEntry entry : uniqueMap.values()) {
            Map<String, Object> map = new HashMap<>();
            map.put("entry", entry);
            
            // Lấy thông tin chiến mã tham gia chạy
            Optional<Horse> horse = horseRepository.findById(entry.getHorseId());
            map.put("horse", horse.orElse(null));

            // Lấy thông tin kỵ sĩ/nài ngựa điều khiển
            Optional<User> jockey = userRepository.findById(entry.getJockeyId());
            map.put("jockey", jockey.orElse(null));

            // Lấy thông tin chủ sở hữu của con ngựa này
            if (horse.isPresent()) {
                Optional<User> owner = userRepository.findById(horse.get().getOwnerId());
                map.put("owner", owner.orElse(null));
            } else {
                map.put("owner", null);
            }
            results.add(map);
        }

        // Sắp xếp thứ tự cán đích từ vị trí cao nhất (1st, 2nd, 3rd...) đến cuối
        results.sort((a, b) -> {
            RaceEntry ea = (RaceEntry) a.get("entry");
            RaceEntry eb = (RaceEntry) b.get("entry");
            if (ea.getFinalPosition() == null) return 1;
            if (eb.getFinalPosition() == null) return -1;
            return ea.getFinalPosition().compareTo(eb.getFinalPosition());
        });

        return ResponseEntity.ok(results);
    }

    // Lấy danh sách toàn bộ ngày hội đua công khai
    @GetMapping("/meetings")
        public ResponseEntity<List<RaceMeeting>> getMeetings() {
        return ResponseEntity.ok(raceMeetingRepository.findAll());
    }

    // Lấy danh sách các trận đua, có thể lọc theo ID ngày hội đua (meetingId)
    @GetMapping("/races")
        public ResponseEntity<List<Race>> getRaces(@RequestParam(required = false) Integer meetingId) {
        if (meetingId != null) {
            return ResponseEntity.ok(raceRepository.findByRaceMeetingId(meetingId));
        }
        return ResponseEntity.ok(raceRepository.findAll());
    }

    // Lấy danh sách người dùng, lọc theo vai trò (roleId)
    @GetMapping("/users")
        public ResponseEntity<List<User>> getUsers(@RequestParam(required = false) Integer roleId) {
        if (roleId != null) {
            return ResponseEntity.ok(userRepository.findByRoleId(roleId));
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    // Lấy toàn bộ danh sách ngựa đua trong hệ thống
    @GetMapping("/horses")
        public ResponseEntity<List<Horse>> getHorses() {
        return ResponseEntity.ok(horseRepository.findAll());
    }

    // Lấy danh sách các biên bản vi phạm luật thi đấu, lọc theo ID trận đua (raceId)
    @GetMapping("/violations")
        public ResponseEntity<?> getViolations(@RequestParam(required = false) Integer raceId) {
        List<Violation> list;
        if (raceId != null) {
            list = violationRepository.findByRaceId(raceId);
        } else {
            list = violationRepository.findAll();
        }

        List<Map<String, Object>> resolved = new ArrayList<>();
        // Tải trước bản đồ người dùng và ngựa để liên kết nhanh trong vòng lặp
        Map<Integer, User> userMap = new HashMap<>();
        for (User u : userRepository.findAll()) {
            userMap.put(u.getId(), u);
        }
        Map<Integer, Horse> horseMap = new HashMap<>();
        for (Horse h : horseRepository.findAll()) {
            horseMap.put(h.getId(), h);
        }

        for (Violation v : list) {
            Map<String, Object> map = new HashMap<>();
            map.put("violation", v);

            Horse horse = horseMap.get(v.getHorseId());
            map.put("horseName", horse != null ? horse.getName() : "Unknown");

            User jockey = userMap.get(v.getJockeyId());
            map.put("jockeyName", jockey != null ? jockey.getUsername() : "Unknown");

            resolved.add(map);
        }
        return ResponseEntity.ok(resolved);
    }

    // Lấy thông tin hồ sơ chi tiết của người dùng dựa trên vai trò của họ
    @GetMapping("/users/{id}/profile")
        public ResponseEntity<?> getUserProfile(@PathVariable Integer id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        User user = userOpt.get();
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("roleId", user.getRoleId());
        response.put("avatar", user.getAvatar());
        response.put("biography", user.getBiography() != null ? user.getBiography() : "");
        response.put("balance", user.getBalance() != null ? user.getBalance() : BigDecimal.ZERO);

        if (user.getRoleId() == 1) {
            // Thống kê dành riêng cho Admin
            long managedUsersCount = userRepository.count();
            long managedHorsesCount = horseRepository.count();
            long totalSeasons = seasonRepository.count();
            response.put("managedUsersCount", managedUsersCount);
            response.put("managedHorsesCount", managedHorsesCount);
            response.put("totalSeasons", totalSeasons);
        } else if (user.getRoleId() == 4) {
            // Thống kê dành riêng cho Trọng tài
            long totalRacesRefereed = raceRefereeRepository.findByRefereeId(id).size();
            long totalViolationsIssued = violationRepository.findAll().stream().filter(v -> "APPROVED".equals(v.getStatus())).count();
            response.put("totalRacesRefereed", totalRacesRefereed);
            response.put("totalViolationsIssued", totalViolationsIssued);
        } else if (user.getRoleId() == 5) {
            // Khán giả
            response.put("memberSince", "2024");
        } else if (user.getRoleId() == 3) {
            // Thống kê chi tiết dành cho kỵ sĩ/nài ngựa (Jockey)
            response.put("weight", user.getWeight());

            List<RaceEntry> entries = raceEntryRepository.findByJockeyId(id);
            // Đếm số lượt cưỡi ngựa thi đấu thực tế
            long totalRides = entries.stream()
                .filter(e -> "FINISHED".equalsIgnoreCase(e.getStatus()) || "DISQUALIFIED".equalsIgnoreCase(e.getStatus()))
                .count();
            // Đếm số lần đạt hạng 1 (Vô địch)
            long wins = entries.stream()
                .filter(e -> "FINISHED".equalsIgnoreCase(e.getStatus()) && Integer.valueOf(1).equals(e.getFinalPosition()))
                .count();
            // Đếm số lần về đích top 3
            long top3 = entries.stream()
                .filter(e -> "FINISHED".equalsIgnoreCase(e.getStatus()) && e.getFinalPosition() != null && e.getFinalPosition() <= 3)
                .count();

            double winRate = totalRides > 0 ? (wins * 100.0) / totalRides : 0.0;
            double top3Rate = totalRides > 0 ? (top3 * 100.0) / totalRides : 0.0;

            response.put("totalRides", totalRides);
            response.put("wins", wins);
            response.put("top3", top3);
            response.put("winRate", winRate);
            response.put("top3Rate", top3Rate);

            // Thu thập toàn bộ lịch sử trận đấu của kỵ sĩ này từ cơ sở dữ liệu
            List<Map<String, Object>> history = new ArrayList<>();
            List<RaceEntry> sortedEntries = new ArrayList<>(entries);
            sortedEntries.sort((e1, e2) -> {
                Optional<Race> r1 = raceRepository.findById(e1.getRaceId());
                Optional<Race> r2 = raceRepository.findById(e2.getRaceId());
                if (r1.isPresent() && r2.isPresent() && r1.get().getStartTime() != null && r2.get().getStartTime() != null) {
                    return r2.get().getStartTime().compareTo(r1.get().getStartTime());
                }
                return e2.getId().compareTo(e1.getId());
            });

            for (RaceEntry entry : sortedEntries) {
                Map<String, Object> hMap = new HashMap<>();
                hMap.put("position", entry.getFinalPosition() != null ? String.valueOf(entry.getFinalPosition()) : (entry.getFinishTime() != null ? entry.getFinishTime() : "—"));
                hMap.put("finishTime", entry.getFinishTime());
                hMap.put("prizeMoney", entry.getPrizeMoney());
                
                Optional<Horse> horse = horseRepository.findById(entry.getHorseId());
                hMap.put("horseName", horse.map(Horse::getName).orElse("Unknown"));

                Optional<Race> race = raceRepository.findById(entry.getRaceId());
                if (race.isPresent()) {
                    hMap.put("classLevel", race.get().getClassLevel());
                    hMap.put("startTime", race.get().getStartTime());
                    Optional<RaceMeeting> meeting = raceMeetingRepository.findById(race.get().getRaceMeetingId());
                    hMap.put("meetingName", meeting.map(RaceMeeting::getName).orElse("—"));
                }
                history.add(hMap);
            }
            response.put("history", history);

        } else if (user.getRoleId() == 2) {
            // Thống kê chi tiết dành cho Chủ ngựa (Owner)
            List<Horse> horses = horseRepository.findByOwnerId(id);
            List<Horse> activeHorses = horses.stream()
                .filter(h -> "ACTIVE".equalsIgnoreCase(h.getStatus()))
                .toList();
            response.put("stableSize", activeHorses.size()); // Quy mô chuồng ngựa active

            double totalEarnings = 0.0;
            double sumPos = 0.0;
            int finishedRaces = 0;
            List<RaceEntry> ownerEntries = new ArrayList<>();

            // Tính tổng tiền thưởng thu về và thứ hạng trung bình của chuồng
            for (Horse h : horses) {
                List<RaceEntry> hEntries = raceEntryRepository.findByHorseId(h.getId());
                ownerEntries.addAll(hEntries);
                for (RaceEntry e : hEntries) {
                    if ("FINISHED".equalsIgnoreCase(e.getStatus())) {
                        finishedRaces++;
                        if (e.getFinalPosition() != null) {
                            sumPos += e.getFinalPosition();
                        }
                        if (e.getPrizeMoney() != null) {
                            totalEarnings += e.getPrizeMoney().doubleValue();
                        }
                    }
                }
            }

            double avgPosition = finishedRaces > 0 ? sumPos / finishedRaces : 0.0;
            response.put("totalEarnings", totalEarnings);
            response.put("avgPosition", avgPosition);

            // Danh sách các chiến mã đang hoạt động
            List<Map<String, Object>> activeHorsesList = new ArrayList<>();
            for (Horse h : activeHorses) {
                Map<String, Object> hMap = new HashMap<>();
                hMap.put("id", h.getId());
                hMap.put("name", h.getName());
                hMap.put("breed", h.getBreed());
                hMap.put("currentRating", h.getCurrentRating());
                activeHorsesList.add(hMap);
            }
            response.put("activeHorses", activeHorsesList);

            // Lịch sử toàn bộ các trận đấu của toàn bộ chuồng ngựa từ cơ sở dữ liệu
            List<Map<String, Object>> history = new ArrayList<>();
            ownerEntries.sort((e1, e2) -> {
                Optional<Race> r1 = raceRepository.findById(e1.getRaceId());
                Optional<Race> r2 = raceRepository.findById(e2.getRaceId());
                if (r1.isPresent() && r2.isPresent() && r1.get().getStartTime() != null && r2.get().getStartTime() != null) {
                    return r2.get().getStartTime().compareTo(r1.get().getStartTime());
                }
                return e2.getId().compareTo(e1.getId());
            });

            for (RaceEntry entry : ownerEntries) {
                Map<String, Object> hMap = new HashMap<>();
                hMap.put("position", entry.getFinalPosition() != null ? String.valueOf(entry.getFinalPosition()) : (entry.getFinishTime() != null ? entry.getFinishTime() : "—"));
                hMap.put("finishTime", entry.getFinishTime());
                hMap.put("prizeMoney", entry.getPrizeMoney());
                
                Optional<Horse> horse = horseRepository.findById(entry.getHorseId());
                hMap.put("horseName", horse.map(Horse::getName).orElse("—"));

                Optional<Race> race = raceRepository.findById(entry.getRaceId());
                if (race.isPresent()) {
                    hMap.put("classLevel", race.get().getClassLevel());
                    hMap.put("startTime", race.get().getStartTime());
                    Optional<RaceMeeting> meeting = raceMeetingRepository.findById(race.get().getRaceMeetingId());
                    hMap.put("meetingName", meeting.map(RaceMeeting::getName).orElse("—"));
                }
                history.add(hMap);
            }
            response.put("history", history);
        }

        return ResponseEntity.ok(response);
    }

    // Tra cứu phong độ chi tiết của một con ngựa theo ID
    @GetMapping("/horses/{horseId}/performance")
        public ResponseEntity<?> getHorsePerformance(@PathVariable Integer horseId) {
        Optional<Horse> horseOpt = horseRepository.findById(horseId);
        if (horseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Horse horse = horseOpt.get();

        Map<String, Object> response = new HashMap<>();
        response.put("horseId", horse.getId());
        response.put("name", horse.getName());
        response.put("horseName", horse.getName());
        response.put("breed", horse.getBreed());
        response.put("sex", horse.getSex());
        response.put("avatar", horse.getAvatar());
        response.put("currentRating", horse.getCurrentRating());
        response.put("totalRaces", horse.getTotalRaces());
        response.put("totalWins", horse.getTotalWins());
        double winRate = (horse.getTotalRaces() != null && horse.getTotalRaces() > 0)
                ? (double) (horse.getTotalWins() != null ? horse.getTotalWins() : 0) / horse.getTotalRaces() * 100.0
                : 0.0;
        response.put("winRate", Math.round(winRate * 10.0) / 10.0);

        List<RaceEntry> entries = raceEntryRepository.findByHorseId(horseId);

        List<Map<String, Object>> history = new ArrayList<>();
        for (RaceEntry entry : entries) {
            Map<String, Object> item = new HashMap<>();
            item.put("raceId", entry.getRaceId());
            item.put("finalPosition", entry.getFinalPosition() != null ? String.valueOf(entry.getFinalPosition()) : (entry.getFinishTime() != null ? entry.getFinishTime() : "—"));
            item.put("position", entry.getFinalPosition() != null ? String.valueOf(entry.getFinalPosition()) : (entry.getFinishTime() != null ? entry.getFinishTime() : "—"));
            item.put("finishTime", entry.getFinishTime());
            item.put("ratingAdjustment", entry.getRatingAdjustment());
            item.put("prizeMoney", entry.getPrizeMoney());
            item.put("status", entry.getStatus());
            item.put("gateNumber", entry.getGateNumber());

            // Điền tên nài ngựa cưỡi chiến mã này
            if (entry.getJockeyId() != null) {
                userRepository.findById(entry.getJockeyId())
                        .ifPresent(u -> item.put("jockeyName", u.getUsername()));
            }
            if (!item.containsKey("jockeyName")) {
                item.put("jockeyName", null);
            }

            // Điền thông tin chi tiết trận đấu
            if (entry.getRaceId() != null) {
                Optional<Race> raceOpt = raceRepository.findById(entry.getRaceId());
                if (raceOpt.isPresent()) {
                    Race race = raceOpt.get();
                    item.put("classLevel", race.getClassLevel());
                    item.put("startTime", race.getStartTime());
                    item.put("raceMeetingId", race.getRaceMeetingId());
                    if (race.getRaceMeetingId() != null) {
                        raceMeetingRepository.findById(race.getRaceMeetingId())
                                .ifPresent(m -> item.put("meetingName", m.getName()));
                    }
                }
            }
            if (!item.containsKey("classLevel")) item.put("classLevel", null);
            if (!item.containsKey("startTime")) item.put("startTime", null);
            if (!item.containsKey("raceMeetingId")) item.put("raceMeetingId", null);
            if (!item.containsKey("meetingName")) item.put("meetingName", null);

            history.add(item);
        }

        // Sắp xếp lịch sử thi đấu theo thời gian giảm dần (trận đua mới nhất lên trước)
        history.sort((a, b) -> {
            Object st1 = a.get("startTime");
            Object st2 = b.get("startTime");
            if (st1 == null && st2 == null) return 0;
            if (st1 == null) return 1;
            if (st2 == null) return -1;
            return ((Comparable) st2).compareTo(st1);
        });

        response.put("history", history);
        response.put("raceHistory", history);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/wallet/deposit")
    public ResponseEntity<?> selfDepositWallet(@RequestBody Map<String, Object> request) {
        try {
            Object userIdObj = request.get("userId");
            Object amtObj = request.get("amount");
            if (userIdObj == null || amtObj == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "userId and amount are required"));
            }
            Integer userId = Integer.parseInt(userIdObj.toString());
            BigDecimal amount = new BigDecimal(amtObj.toString());
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Deposit amount must be greater than 0"));
            }
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
            BigDecimal current = user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO;
            user.setWalletBalance(current.add(amount));
            user.setBalance(current.add(amount));
            userRepository.save(user);

            // Auto-reactivate any SUSPENDED_DEFICIT entries if wallet balance is restored to >= 0
            if (user.getWalletBalance().compareTo(BigDecimal.ZERO) >= 0) {
                if (user.getRoleId() != null && user.getRoleId() == 2) {
                    List<Horse> ownerHorses = horseRepository.findByOwnerId(user.getId());
                    List<Integer> hIds = ownerHorses.stream().map(Horse::getId).collect(Collectors.toList());
                    if (!hIds.isEmpty()) {
                        List<RaceEntry> suspended = raceEntryRepository.findAll().stream()
                                .filter(e -> hIds.contains(e.getHorseId()) && "SUSPENDED_DEFICIT".equalsIgnoreCase(e.getStatus()))
                                .collect(Collectors.toList());
                        for (RaceEntry e : suspended) {
                            e.setStatus("APPROVED");
                            raceEntryRepository.save(e);
                        }
                    }
                } else {
                    List<RaceEntry> suspended = raceEntryRepository.findByJockeyId(user.getId()).stream()
                            .filter(e -> "SUSPENDED_DEFICIT".equalsIgnoreCase(e.getStatus()))
                            .collect(Collectors.toList());
                    for (RaceEntry e : suspended) {
                        e.setStatus("APPROVED");
                        raceEntryRepository.save(e);
                    }
                }
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Deposit successful. Active race entries restored.", "newBalance", user.getWalletBalance()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * POST /api/public/wallet/withdraw
     * Đơn rút tiền của người dùng:
     * - Nếu PAYMENT_GATEWAY_MODE = 'MOCK' hoặc AUTO_DISBURSEMENT_ENABLED = 'TRUE':
     *   Tự động xác nhận chuyển khoản thành công (PROCESSED) + Trừ ví tức thì.
     * - Nếu PAYMENT_GATEWAY_MODE = 'LIVE' và AUTO_DISBURSEMENT_ENABLED = 'FALSE':
     *   Tạo yêu cầu PENDING chờ Admin chuyển khoản thật và duyệt thủ công.
     */
    @PostMapping("/wallet/withdraw")
    public ResponseEntity<?> selfWithdrawWallet(@RequestBody Map<String, Object> request) {
        try {
            Object userIdObj = request.get("userId");
            Object amtObj = request.get("amount");
            if (userIdObj == null || amtObj == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "userId and amount are required"));
            }
            Integer userId = Integer.parseInt(userIdObj.toString());
            BigDecimal amount = new BigDecimal(amtObj.toString());
            if (amount.compareTo(BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Withdrawal amount must be greater than 0"));
            }

            // Read minimum withdrawal from SystemConfig (default 50,000 VNĐ)
            BigDecimal minWithdrawal = systemConfigRepository.findById("MIN_WITHDRAWAL_AMOUNT")
                    .map(c -> { try { return new BigDecimal(c.getConfigValue()); } catch (Exception ex) { return new BigDecimal("50000"); } })
                    .orElse(new BigDecimal("50000"));
            if (amount.compareTo(minWithdrawal) < 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false,
                        "error", "Minimum withdrawal amount is " + String.format("%,.0f", minWithdrawal) + " VND"));
            }

            // Kiểm tra số dư hiện tại có đủ không
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
            BigDecimal current = user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO;
            if (amount.compareTo(current) > 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false,
                        "error", "Insufficient funds in wallet. Available: " + String.format("%,.0f", current) + " VND"));
            }

            // Lấy bank details từ request body
            String bankName = request.get("bankName") != null ? request.get("bankName").toString() : "Bank Transfer";
            String accountNumber = request.get("accountNumber") != null ? request.get("accountNumber").toString() : "";
            String accountHolder = request.get("accountHolder") != null ? request.get("accountHolder").toString() : "";
            String notes = request.get("notes") != null ? request.get("notes").toString() : "";

            // Đọc cấu hình Gateway Mode & Auto Disbursement Payout
            String mode = systemConfigRepository.findById("PAYMENT_GATEWAY_MODE")
                    .map(c -> c.getConfigValue().toUpperCase()).orElse("MOCK");
            String autoDisburse = systemConfigRepository.findById("AUTO_DISBURSEMENT_ENABLED")
                    .map(c -> c.getConfigValue().toUpperCase()).orElse("TRUE");

            boolean isInstantAutoPayout = "MOCK".equals(mode) || "TRUE".equals(autoDisburse);

            WithdrawalRequest wr = new WithdrawalRequest();
            wr.setUserId(userId);
            wr.setAmount(amount);
            wr.setBankName(bankName);
            wr.setAccountNumber(accountNumber);
            wr.setAccountHolder(accountHolder.toUpperCase());
            wr.setNotes(notes);
            wr.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));

            if (isInstantAutoPayout) {
                // 🟢 INSTANT AUTO PAYOUT (MOCK Mode hoặc LIVE với Auto Disbursement): Trừ ví ngay lập tức + Mark PROCESSED
                user.setWalletBalance(current.subtract(amount));
                userRepository.save(user);

                wr.setStatus("PROCESSED");
                wr.setProcessedNote("Instant auto-disbursement payout (" + mode + " Mode)");
                wr.setProcessedAt(new java.sql.Timestamp(System.currentTimeMillis()));
                withdrawalRequestRepository.save(wr);

                // Ghi log giao dịch WITHDRAWAL
                StringBuilder desc = new StringBuilder("Cash-out payout via ").append(bankName);
                if (!accountNumber.isBlank()) desc.append(" | Acc: ").append(accountNumber);
                if (!accountHolder.isBlank()) desc.append(" (Holder: ").append(accountHolder.toUpperCase()).append(")");
                if (!notes.isBlank()) desc.append(" | Note: ").append(notes);

                WalletTransaction tx = new WalletTransaction();
                tx.setUserId(userId);
                tx.setAmount(amount.negate());
                tx.setTransactionType("WITHDRAWAL");
                tx.setDescription(desc.toString());
                tx.setCreatedAt(new java.sql.Timestamp(System.currentTimeMillis()));
                walletTransactionRepository.save(tx);

                // Gửi thông báo rút tiền thành công
                notificationService.notifyUserOnWithdrawalStatus(userId, amount, true, "Auto-disbursement payout via " + bankName);

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Withdrawal processed successfully! " + String.format("%,.0f", amount) + " VND transferred to your bank account via NAPAS 24/7.",
                    "requestId", wr.getId(),
                    "status", "PROCESSED",
                    "newBalance", user.getWalletBalance()
                ));
            } else {
                // 🟡 MANUAL APPROVAL FLOW (LIVE Mode với Auto Disbursement = FALSE): Giữ nguyên ví + Mark PENDING
                wr.setStatus("PENDING");
                withdrawalRequestRepository.save(wr);

                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Withdrawal request submitted successfully. Your request is pending Admin manual bank transfer approval. Estimated processing time: 1-3 business days.",
                    "requestId", wr.getId(),
                    "status", "PENDING",
                    "currentBalance", current
                ));
            }
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * GET /api/public/wallet/withdrawal-requests/{userId}
     * Lấy danh sách tất cả withdrawal requests của một user (để hiển thị trên UI).
     */
    @GetMapping("/wallet/withdrawal-requests/{userId}")
    public ResponseEntity<?> getUserWithdrawalRequests(@PathVariable Integer userId) {
        try {
            List<WithdrawalRequest> requests = withdrawalRequestRepository.findByUserIdOrderByCreatedAtDesc(userId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
