package com.horseracing.backend.controller;

import com.horseracing.backend.entity.*;
import com.horseracing.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/public")
@CrossOrigin(origins = "*")
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
    public ResponseEntity<List<Violation>> getViolations() {
        return ResponseEntity.ok(violationRepository.findAll());
    }
}
