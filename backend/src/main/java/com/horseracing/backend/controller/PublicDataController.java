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

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
@Tag(
    name = "Public Data Service",
    description = "📊 **Cấu trúc Mô-đun Tra Cứu Dữ Liệu Công Khai (Public Data Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `PublicDataController.java`\n" +
                  "* **Repositories**: `SeasonRepository.java`, `RaceRepository.java`, `RaceEntryRepository.java`, `HorseRepository.java`, `UserRepository.java`, `RaceMeetingRepository.java`, `ViolationRepository.java`\n" +
                  "* **Entities**: `Season.java`, `Race.java`, `RaceEntry.java`, `Horse.java`, `User.java`, `RaceMeeting.java`, `Violation.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Cung cấp APIs công khai cho khách truy cập/khán giả tra cứu mà không cần đăng nhập.\n" +
                  "2. Tra cứu tổng quan số lượng trận đấu, tổng số tiền thưởng đã trao, chiến mã có Rating cao nhất.\n" +
                  "3. Tra cứu bảng xếp hạng kết quả từng trận đua (`getResults`), danh sách lỗi vi phạm (`getViolations`).\n" +
                  "4. Xem hồ sơ cá nhân công khai (`getUserProfile`) của Nài ngựa, Chủ ngựa, Trọng tài và Thống kê phong độ thi đấu từng con ngựa (`getHorsePerformance`)."
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

    @GetMapping("/stats")
    @Operation(summary = "Lấy thống kê tổng quan toàn hệ thống", description = "📌 **Code Architecture**: `PublicDataController.getStats()` -> Tổng hợp số trận đua, tổng tiền thưởng, số ngựa active từ `SeasonRepository`, `RaceRepository`, `HorseRepository`")
    public ResponseEntity<?> getStats() {
        long seasonsCompleted = seasonRepository.findAll().stream().filter(s -> "COMPLETED".equals(s.getStatus())).count();
        long totalRacesRun = raceRepository.findAll().stream().filter(r -> "OFFICIAL".equals(r.getStatus())).count();
        
        BigDecimal totalPrizeDistributed = raceEntryRepository.findAll().stream()
                .map(RaceEntry::getPrizeMoney)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long totalActiveHorses = horseRepository.findByStatus("ACTIVE").size();
        long totalActiveJockeys = userRepository.findByRoleId(3).stream().filter(u -> "ACTIVE".equals(u.getStatus())).count();

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

    @GetMapping("/results")
    @Operation(summary = "Lấy kết quả xếp hạng trận đua", description = "📌 **Code Architecture**: `PublicDataController.getResults()` -> `RaceEntryRepository.findByRaceId()` -> Ghép thông tin Horse, Jockey, Owner")
    public ResponseEntity<?> getResults(@RequestParam Integer raceId) {
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        
        List<Map<String, Object>> results = new ArrayList<>();
        for (RaceEntry entry : entries) {
            Map<String, Object> map = new HashMap<>();
            map.put("entry", entry);
            
            Optional<Horse> horse = horseRepository.findById(entry.getHorseId());
            map.put("horse", horse.orElse(null));

            Optional<User> jockey = userRepository.findById(entry.getJockeyId());
            map.put("jockey", jockey.orElse(null));

            if (horse.isPresent()) {
                Optional<User> owner = userRepository.findById(horse.get().getOwnerId());
                map.put("owner", owner.orElse(null));
            } else {
                map.put("owner", null);
            }
            results.add(map);
        }

        results.sort((a, b) -> {
            RaceEntry ea = (RaceEntry) a.get("entry");
            RaceEntry eb = (RaceEntry) b.get("entry");
            if (ea.getFinalPosition() == null) return 1;
            if (eb.getFinalPosition() == null) return -1;
            return ea.getFinalPosition().compareTo(eb.getFinalPosition());
        });

        return ResponseEntity.ok(results);
    }

    @GetMapping("/meetings")
    @Operation(summary = "Lấy danh sách các Ngày đua công khai", description = "📌 **Code Architecture**: `PublicDataController.getMeetings()` -> `RaceMeetingRepository.findAll()`")
    public ResponseEntity<List<RaceMeeting>> getMeetings() {
        return ResponseEntity.ok(raceMeetingRepository.findAll());
    }

    @GetMapping("/races")
    @Operation(summary = "Lấy danh sách các trận đua công khai", description = "📌 **Code Architecture**: `PublicDataController.getRaces()` -> `RaceRepository.findByRaceMeetingId()`")
    public ResponseEntity<List<Race>> getRaces(@RequestParam(required = false) Integer meetingId) {
        if (meetingId != null) {
            return ResponseEntity.ok(raceRepository.findByRaceMeetingId(meetingId));
        }
        return ResponseEntity.ok(raceRepository.findAll());
    }

    @GetMapping("/users")
    @Operation(summary = "Lấy danh sách người dùng theo vai trò", description = "📌 **Code Architecture**: `PublicDataController.getUsers()` -> `UserRepository.findByRoleId()`")
    public ResponseEntity<List<User>> getUsers(@RequestParam(required = false) Integer roleId) {
        if (roleId != null) {
            return ResponseEntity.ok(userRepository.findByRoleId(roleId));
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/horses")
    @Operation(summary = "Lấy danh sách tất cả các chiến mã công khai", description = "📌 **Code Architecture**: `PublicDataController.getHorses()` -> `HorseRepository.findAll()`")
    public ResponseEntity<List<Horse>> getHorses() {
        return ResponseEntity.ok(horseRepository.findAll());
    }

    @GetMapping("/violations")
    @Operation(summary = "Lấy danh sách các lỗi vi phạm công khai", description = "📌 **Code Architecture**: `PublicDataController.getViolations()` -> `ViolationRepository.findAll()` -> Ghép tên Ngựa và Nài")
    public ResponseEntity<?> getViolations(@RequestParam(required = false) Integer raceId) {
        List<Violation> list;
        if (raceId != null) {
            list = violationRepository.findByRaceId(raceId);
        } else {
            list = violationRepository.findAll();
        }

        List<Map<String, Object>> resolved = new ArrayList<>();
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

    @GetMapping("/users/{id}/profile")
    @Operation(summary = "Lấy hồ sơ cá nhân công khai của người dùng", description = "📌 **Code Architecture**: `PublicDataController.getUserProfile()` -> Tổng hợp thống kê theo role (Jockey: Win rate; Owner: Total earnings)")
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
            // Admin Profile
            long managedUsersCount = userRepository.count();
            long managedHorsesCount = horseRepository.count();
            long totalSeasons = seasonRepository.count();
            response.put("managedUsersCount", managedUsersCount);
            response.put("managedHorsesCount", managedHorsesCount);
            response.put("totalSeasons", totalSeasons);
        } else if (user.getRoleId() == 4) {
            // Referee Profile
            long totalRacesRefereed = raceRefereeRepository.findByRefereeId(id).size();
            long totalViolationsIssued = violationRepository.findAll().stream().filter(v -> "APPROVED".equals(v.getStatus())).count();
            response.put("totalRacesRefereed", totalRacesRefereed);
            response.put("totalViolationsIssued", totalViolationsIssued);
        } else if (user.getRoleId() == 5) {
            // Spectator Profile
            response.put("memberSince", "2024");
        } else if (user.getRoleId() == 3) {
            // Jockey Profile
            response.put("weight", user.getWeight());

            List<RaceEntry> entries = raceEntryRepository.findByJockeyId(id);
            long totalRides = entries.stream()
                .filter(e -> "FINISHED".equalsIgnoreCase(e.getStatus()) || "DISQUALIFIED".equalsIgnoreCase(e.getStatus()))
                .count();
            long wins = entries.stream()
                .filter(e -> "FINISHED".equalsIgnoreCase(e.getStatus()) && Integer.valueOf(1).equals(e.getFinalPosition()))
                .count();
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

            // Recent history
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

            int limit = Math.min(10, sortedEntries.size());
            for (int i = 0; i < limit; i++) {
                RaceEntry entry = sortedEntries.get(i);
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
            // Owner Profile
            List<Horse> horses = horseRepository.findByOwnerId(id);
            List<Horse> activeHorses = horses.stream()
                .filter(h -> "ACTIVE".equalsIgnoreCase(h.getStatus()))
                .toList();
            response.put("stableSize", activeHorses.size());

            double totalEarnings = 0.0;
            double sumPos = 0.0;
            int finishedRaces = 0;
            List<RaceEntry> ownerEntries = new ArrayList<>();

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

            // Active horses list
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

            // Recent history of stable
            List<Map<String, Object>> history = new ArrayList<>();
            ownerEntries.sort((e1, e2) -> {
                Optional<Race> r1 = raceRepository.findById(e1.getRaceId());
                Optional<Race> r2 = raceRepository.findById(e2.getRaceId());
                if (r1.isPresent() && r2.isPresent() && r1.get().getStartTime() != null && r2.get().getStartTime() != null) {
                    return r2.get().getStartTime().compareTo(r1.get().getStartTime());
                }
                return e2.getId().compareTo(e1.getId());
            });

            int limit = Math.min(10, ownerEntries.size());
            for (int i = 0; i < limit; i++) {
                RaceEntry entry = ownerEntries.get(i);
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

    @GetMapping("/horses/{horseId}/performance")
    @Operation(summary = "Lấy dữ liệu phong độ thi đấu chi tiết của 1 chiến mã", description = "📌 **Code Architecture**: `PublicDataController.getHorsePerformance()` -> Lịch sử `RaceEntry` của ngựa, thứ hạng, biến động rating")
    public ResponseEntity<?> getHorsePerformance(@PathVariable Integer horseId) {
        Optional<Horse> horseOpt = horseRepository.findById(horseId);
        if (horseOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Horse horse = horseOpt.get();

        Map<String, Object> response = new HashMap<>();
        response.put("horseId", horse.getId());
        response.put("horseName", horse.getName());
        response.put("breed", horse.getBreed());
        response.put("sex", horse.getSex());
        response.put("currentRating", horse.getCurrentRating());
        response.put("totalRaces", horse.getTotalRaces());
        response.put("totalWins", horse.getTotalWins());

        List<RaceEntry> entries = raceEntryRepository.findByHorseId(horseId);

        List<Map<String, Object>> history = new ArrayList<>();
        for (RaceEntry entry : entries) {
            Map<String, Object> item = new HashMap<>();
            item.put("raceId", entry.getRaceId());
            item.put("finalPosition", entry.getFinalPosition());
            item.put("finishTime", entry.getFinishTime());
            item.put("ratingAdjustment", entry.getRatingAdjustment());
            item.put("prizeMoney", entry.getPrizeMoney());
            item.put("status", entry.getStatus());
            item.put("gateNumber", entry.getGateNumber());

            // Jockey name
            if (entry.getJockeyId() != null) {
                userRepository.findById(entry.getJockeyId())
                        .ifPresent(u -> item.put("jockeyName", u.getUsername()));
            }
            if (!item.containsKey("jockeyName")) {
                item.put("jockeyName", null);
            }

            // Race details
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

        // Sort by startTime descending (nulls last)
        history.sort((a, b) -> {
            Object st1 = a.get("startTime");
            Object st2 = b.get("startTime");
            if (st1 == null && st2 == null) return 0;
            if (st1 == null) return 1;
            if (st2 == null) return -1;
            return ((Comparable) st2).compareTo(st1);
        });

        response.put("raceHistory", history);
        return ResponseEntity.ok(response);
    }
}
