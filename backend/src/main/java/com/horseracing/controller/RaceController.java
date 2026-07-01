package com.horseracing.backend.controller;

import com.horseracing.backend.dto.RaceDTO;
import com.horseracing.backend.dto.RaceMeetingDTO;
import com.horseracing.backend.dto.SeasonClassRuleDTO;
import com.horseracing.backend.dto.SeasonDTO;
import com.horseracing.backend.service.RaceService;
import com.horseracing.backend.service.SeasonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/races")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RaceController {

    private final RaceService raceService;
    private final SeasonService seasonService;

    @GetMapping("/seasons")
    public ResponseEntity<List<SeasonDTO>> getSeasons() {
        return ResponseEntity.ok(seasonService.getAllSeasons());
    }

    @PostMapping("/seasons")
    public ResponseEntity<?> createSeason(@RequestBody Map<String, Object> body) {
        try {
            SeasonDTO season = seasonService.createSeason(body);
            return ResponseEntity.ok(Map.of("success", true, "season", season));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/seasons/{id}/toggle")
    public ResponseEntity<?> toggleSeasonStatus(@PathVariable Integer id) {
        try {
            String status = seasonService.toggleSeasonStatus(id);
            return ResponseEntity.ok(Map.of("success", true, "status", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/seasons/{id}/extend")
    public ResponseEntity<?> extendSeason(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            String newEndDate = body.get("endDate");
            SeasonDTO updated = seasonService.extendSeason(id, newEndDate);
            return ResponseEntity.ok(Map.of("success", true, "season", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/seasons/{seasonId}/rules")
    public ResponseEntity<List<SeasonClassRuleDTO>> getSeasonRules(@PathVariable Integer seasonId) {
        return ResponseEntity.ok(seasonService.getSeasonRules(seasonId));
    }

    @PostMapping("/seasons/{seasonId}/rules")
    public ResponseEntity<?> saveSeasonRules(@PathVariable Integer seasonId, @RequestBody List<SeasonClassRuleDTO> rules) {
        try {
            seasonService.saveSeasonRules(seasonId, rules);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/meetings")
    public ResponseEntity<List<RaceMeetingDTO>> getMeetings() {
        return ResponseEntity.ok(raceService.getAllMeetings());
    }

    @PostMapping("/meetings")
    public ResponseEntity<?> createMeeting(@RequestBody RaceMeetingDTO meetingDTO) {
        try {
            RaceMeetingDTO savedMeeting = raceService.createMeeting(meetingDTO);
            return ResponseEntity.ok(Map.of("success", true, "meeting", savedMeeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping
    public ResponseEntity<List<RaceDTO>> getRaces() {
        return ResponseEntity.ok(raceService.getAllRaces());
    }

    @PostMapping
    public ResponseEntity<?> createRace(@RequestBody RaceDTO raceDTO) {
        try {
            RaceDTO savedRace = raceService.createRace(raceDTO);
            return ResponseEntity.ok(Map.of("success", true, "race", savedRace));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}")
    public ResponseEntity<?> updateRace(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            RaceDTO updated = raceService.updateRace(id, body);
            return ResponseEntity.ok(Map.of("success", true, "race", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/live")
    public ResponseEntity<List<RaceDTO>> getLiveRaces() {
        return ResponseEntity.ok(raceService.getLiveRaces());
    }
}
