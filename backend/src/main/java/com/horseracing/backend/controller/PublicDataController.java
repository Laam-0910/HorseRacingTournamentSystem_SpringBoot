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
@Tag(name = "Public Data Service", description = "Các API dữ liệu công khai: Thống kê, Bảng xếp hạng, Kết quả thi đấu")
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
    public ResponseEntity<List<RaceMeeting>> getMeetings() {
        return ResponseEntity.ok(raceMeetingRepository.findAll());
    }

    @GetMapping("/races")
    public ResponseEntity<List<Race>> getRaces(@RequestParam(required = false) Integer meetingId) {
        if (meetingId != null) {
            return ResponseEntity.ok(raceRepository.findByRaceMeetingId(meetingId));
        }
        return ResponseEntity.ok(raceRepository.findAll());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getUsers(@RequestParam(required = false) Integer roleId) {
        if (roleId != null) {
            return ResponseEntity.ok(userRepository.findByRoleId(roleId));
        }
        return ResponseEntity.ok(userRepository.findAll());
    }

    @GetMapping("/horses")
    public ResponseEntity<List<Horse>> getHorses() {
        return ResponseEntity.ok(horseRepository.findAll());
    }

    @GetMapping("/violations")
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
            long totalViolationsIssued = violationRepository.findAll().stream().filter(v -> "APPROVED".equals(v.getStatus())).count(); // Just a generic stat for referees or could be specific if they issue it, but violation has no refereeId. Let's just use a general stat.
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
