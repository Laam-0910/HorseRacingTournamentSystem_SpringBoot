package com.horseracing.backend.controller;

import com.horseracing.backend.entity.*;
import com.horseracing.backend.repository.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

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
@Tag(
    name = "14. Public Data & Statistics",
    description = "📊 **BƯỚC 14: DỮ LIỆU CÔNG KHAI & THỐNG KÊ (PUBLIC ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `PublicDataController.java`, `PublicChatController.java`\n" +
                  "* **Repositories**: `SeasonRepository.java`, `RaceRepository.java`, `RaceEntryRepository.java`, `HorseRepository.java`, `UserRepository.java`\n" +
                  "* **Entities**: `Season.java`, `Race.java`, `RaceEntry.java`, `Horse.java`, `User.java`\n" +
                  "* **Frontend**: `Landing.tsx` (landing), `Fixtures.tsx` (dashboards/components), `Results.tsx` (dashboards/components), `Spectator.tsx` (dashboards), `Statistics.tsx`, `ProfileModal.tsx`, `HorsePerformanceModal.tsx`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Cung cấp dữ liệu công khai cho khán giả/khách ghé thăm (không cần đăng nhập): Lịch đua, kết quả, thống kê.\n" +
                  "2. Xem kết quả trận đua, lịch sử thành tích chiến mã, hồ sơ cá nhân và biểu đồ thống kê phông độ."
)
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

    // Lấy thống kê tổng hợp toàn hệ thống
    @GetMapping("/stats")
    @Operation(
        summary = "GET: Lấy thống kê tổng quan toàn hệ thống",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `PublicDataController.getStats()`\n" +
                      "* **Services**: (Direct Repository access)\n" +
                      "* **Repositories**: `SeasonRepository.findAll()`, `RaceRepository.findAll()`, `RaceEntryRepository.findAll()`, `HorseRepository.findByStatus()`\n" +
                      "* **Entities**: `Season.java`, `Race.java`, `RaceEntry.java`, `Horse.java`, `User.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`activeSeason`, `seasonsCompleted`, `totalRacesRun`, `totalPrizeDistributed`, `totalActiveHorses`, `totalActiveJockeys`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`activeSeason`, `seasonsCompleted`, `totalRacesRun`, `totalPrizeDistributed`, `totalActiveHorses`, `totalActiveJockeys`)\n" +
                      "* **Frontend**: `Landing.tsx` (landing), `Spectator.tsx` (dashboards), `publicDataService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Đếm tổng số mùa giải hoàn thành, số trận đua chính thức đã chạy.\n" +
                      "2. Cộng dồn tổng số tiền thưởng đã trao cho các chủ ngựa & nài ngựa.\n" +
                      "3. Đếm tổng số chiến mã và nài ngựa đang hoạt động trong hệ thống."
    )
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
    @Operation(
        summary = "GET: Lấy kết quả xếp hạng trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `PublicDataController.getResults()`\n" +
                      "* **Services**: (Direct Repository access)\n" +
                      "* **Repositories**: `RaceEntryRepository.findByRaceId()`, `HorseRepository.findById()`, `UserRepository.findById()`\n" +
                      "* **Entities**: `RaceEntry.java`, `Horse.java`, `User.java`\n" +
                      "* **DTOs**: `List<Map<String, Object>>` (Chứa `entry`, `horse`, `jockey`, `owner`)\n" +
                      "* **DTO Response**: `List<Map<String, Object>>` (`entry`, `horse`, `jockey`, `owner`)\n" +
                      "* **Frontend**: `Results.tsx` (dashboards), `Spectator.tsx`, `publicDataService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tìm danh sách `RaceEntry` của trận đua theo `raceId`.\n" +
                      "2. Liên kết ghép dữ liệu Ngựa, Nài ngựa và Chủ sở hữu.\n" +
                      "3. Sắp xếp thứ tự cán đích từ vị trí số 1 đến cuối cùng."
    )
    public ResponseEntity<?> getResults(@RequestParam Integer raceId) {
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        
        List<Map<String, Object>> results = new ArrayList<>();
        for (RaceEntry entry : entries) {
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
    @Operation(
        summary = "GET: Lấy danh sách các Ngày đua công khai",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `PublicDataController.getMeetings()`\n" +
                      "* **Services**: (Direct Repository access)\n" +
                      "* **Repositories**: `RaceMeetingRepository.findAll()`\n" +
                      "* **Entities**: `RaceMeeting.java`\n" +
                      "* **DTOs**: `RaceMeeting`\n" +
                      "* **DTO Response**: `List<RaceMeeting>`\n" +
                      "* **Frontend**: `Fixtures.tsx` (dashboards), `Landing.tsx`, `publicDataService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Truy vấn toàn bộ danh sách Ngày hội đua công khai trong cơ sở dữ liệu."
    )
    public ResponseEntity<List<RaceMeeting>> getMeetings() {
        return ResponseEntity.ok(raceMeetingRepository.findAll());
    }

    // Lấy danh sách các trận đua, có thể lọc theo ID ngày hội đua (meetingId)
    @GetMapping("/races")
    @Operation(
        summary = "GET: Lấy danh sách các trận đua công khai",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `PublicDataController.getRaces()`\n" +
                      "* **Services**: (Direct Repository access)\n" +
                      "* **Repositories**: `RaceRepository.findByRaceMeetingId()`, `RaceRepository.findAll()`\n" +
                      "* **Entities**: `Race.java`\n" +
                      "* **DTOs**: `Race`\n" +
                      "* **DTO Response**: `List<Race>`\n" +
                      "* **Frontend**: `Fixtures.tsx` (dashboards), `Spectator.tsx`, `publicDataService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Nếu có `meetingId`: Trả về danh sách trận đua thuộc Ngày hội đua cụ thể.\n" +
                      "2. Nếu không: Trả về toàn bộ danh sách trận đua trong hệ thống."
    )
    public ResponseEntity<List<Race>> getRaces(@RequestParam(required = false) Integer meetingId) {
        if (meetingId != null) {
            return ResponseEntity.ok(raceRepository.findByRaceMeetingId(meetingId));
        }
        return ResponseEntity.ok(raceRepository.findAll());
    }

    // Lấy danh sách người dùng, lọc theo vai trò (roleId)
    @GetMapping("/users")
    @Operation(
        summary = "GET: Lấy danh sách người dùng theo vai trò",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `PublicDataController.getUsers()`\n" +
                      "* **Services**: (Direct Repository access)\n" +
                      "* **Repositories**: `UserRepository.findByRoleId()`, `UserRepository.findAll()`\n" +
                      "* **Entities**: `User.java`\n" +
                      "* **DTOs**: `User`\n" +
                      "* **DTO Response**: `List<User>`\n" +
                      "* **Frontend**: `ProfileModal.tsx`, `Spectator.tsx`, `publicDataService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Nếu có `roleId`: Lọc danh sách người dùng theo vai trò cụ thể (Admin=1, Owner=2, Jockey=3...).\n" +
                      "2. Nếu không: Trả về toàn bộ người dùng trong hệ thống."
    )
    public ResponseEntity<List<User>> getUsers(@RequestParam(required = false) Integer roleId) {
        if (roleId != null) {
            return ResponseEntity.ok(userRepository.findByRoleId(roleId));
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    // Lấy toàn bộ danh sách ngựa đua trong hệ thống
    @GetMapping("/horses")
    @Operation(
        summary = "GET: Lấy danh sách tất cả các chiến mã công khai",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `PublicDataController.getHorses()`\n" +
                      "* **Services**: (Direct Repository access)\n" +
                      "* **Repositories**: `HorseRepository.findAll()`\n" +
                      "* **Entities**: `Horse.java`\n" +
                      "* **DTOs**: `Horse`\n" +
                      "* **DTO Response**: `List<Horse>`\n" +
                      "* **Frontend**: `Spectator.tsx`, `HorsePerformanceModal.tsx`, `publicDataService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Truy vấn toàn bộ danh sách chiến mã đang có trong cơ sở dữ liệu."
    )
    public ResponseEntity<List<Horse>> getHorses() {
        return ResponseEntity.ok(horseRepository.findAll());
    }

    // Lấy danh sách các biên bản vi phạm luật thi đấu, lọc theo ID trận đua (raceId)
    @GetMapping("/violations")
    @Operation(
        summary = "GET: Lấy danh sách các lỗi vi phạm công khai",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `PublicDataController.getViolations()`\n" +
                      "* **Services**: (Direct Repository access)\n" +
                      "* **Repositories**: `ViolationRepository.findByRaceId()`, `ViolationRepository.findAll()`, `UserRepository.findAll()`, `HorseRepository.findAll()`\n" +
                      "* **Entities**: `Violation.java`, `User.java`, `Horse.java`\n" +
                      "* **DTOs**: `List<Map<String, Object>>` (`violation`, `horseName`, `jockeyName`)\n" +
                      "* **DTO Response**: `List<Map<String, Object>>` (`violation`, `horseName`, `jockeyName`)\n" +
                      "* **Frontend**: `RefereeIncidents.tsx`, `Spectator.tsx`, `publicDataService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Lấy danh sách biên bản vi phạm, có thể lọc theo `raceId`.\n" +
                      "2. Liên kết tên ngựa và nài ngựa tương ứng để dễ tra cứu."
    )
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
    @Operation(
        summary = "GET: Lấy hồ sơ cá nhân công khai của người dùng",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `PublicDataController.getUserProfile()`\n" +
                      "* **Services**: (Direct Repository access)\n" +
                      "* **Repositories**: `UserRepository.findById()`, `RaceEntryRepository.findByJockeyId()`, `HorseRepository.findByOwnerId()`, `ViolationRepository.findAll()`, `RaceRefereeRepository.findByRefereeId()`\n" +
                      "* **Entities**: `User.java`, `RaceEntry.java`, `Horse.java`, `Violation.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (Chứa `username`, `email`, `roleId`, `avatar`, `history`, `winRate`, `totalEarnings`...)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`id`, `username`, `email`, `roleId`, `avatar`, `history`, `winRate`...)\n" +
                      "* **Frontend**: `ProfileModal.tsx`, `Spectator.tsx`, `publicDataService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Kiểm tra vai trò của người dùng (Admin, Nài ngựa, Chủ ngựa, Trọng tài).\n" +
                      "2. Tổng hợp các chỉ số thống kê cá nhân cụ thể theo từng vai trò."
    )
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
    @Operation(
        summary = "GET: Lấy dữ liệu phong độ thi đấu chi tiết của 1 chiến mã",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `PublicDataController.getHorsePerformance()`\n" +
                      "* **Services**: (Direct Repository access)\n" +
                      "* **Repositories**: `HorseRepository.findById()`, `RaceEntryRepository.findByHorseId()`\n" +
                      "* **Entities**: `Horse.java`, `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`horseName`, `currentRating`, `totalRaces`, `totalWins`, `raceHistory`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`horseName`, `currentRating`, `totalRaces`, `totalWins`, `raceHistory`)\n" +
                      "* **Frontend**: `HorsePerformanceModal.tsx`, `Spectator.tsx`, `publicDataService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Lấy thông tin tổng quan của chiến mã (Tên, Giống, Điểm Rating hiện tại).\n" +
                      "2. Truy vấn danh sách tất cả các trận đấu mà chiến mã đã tham gia, sắp xếp theo thời gian mới nhất."
    )
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
}
