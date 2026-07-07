package com.horseracing.backend.controller;

import com.horseracing.backend.dto.ViolationDTO;
import com.horseracing.backend.service.ProcessResultsService;
import com.horseracing.backend.service.RefereeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/referee")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RefereeController {

    private final RefereeService refereeService;
    private final ProcessResultsService processResultsService;

    @PostMapping("/pre-check")
    public ResponseEntity<?> preRaceCheck(@RequestBody Map<String, Object> request) {
        try {
            Integer raceId = (Integer) request.get("raceId");
            List<Map<String, Object>> entriesData = (List<Map<String, Object>>) request.get("entries");

            refereeService.preRaceCheck(raceId, entriesData);
            return ResponseEntity.ok(Map.of("success", true, "message", "Pre-race check completed. Race is now RUNNING."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/violations")
    public ResponseEntity<?> logViolation(@RequestBody ViolationDTO violationDTO) {
        try {
            ViolationDTO saved = refereeService.logViolation(violationDTO);
            return ResponseEntity.ok(Map.of("success", true, "violation", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/results")
    public ResponseEntity<?> confirmResults(@RequestBody Map<String, Object> request) {
        try {
            Integer raceId = (Integer) request.get("raceId");
            String stewardReport = (String) request.get("stewardReport");
            List<Map<String, Object>> entriesResults = (List<Map<String, Object>>) request.get("results");

            processResultsService.confirmResults(raceId, stewardReport, entriesResults);
            return ResponseEntity.ok(Map.of("success", true, "message", "Results and weights verified. Race status set to OFFICIAL."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/dashboard")
    public ResponseEntity<Map<String, Object>> getRefereeDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(refereeService.getRefereeDashboard(id));
    }

    @PostMapping("/races/{raceId}/stop")
    public ResponseEntity<?> stopRace(@PathVariable Integer raceId, @RequestBody Map<String, String> body) {
        try {
            String stewardReport = body.get("stewardReport");
            refereeService.stopRace(raceId, stewardReport);
            return ResponseEntity.ok(Map.of("success", true, "message", "Emergency stop executed. Race status set to CANCELLED."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/suspend")
    public ResponseEntity<?> suspendRace(@PathVariable Integer raceId, @RequestBody Map<String, String> body) {
        try {
            String stewardReport = body.get("stewardReport");
            refereeService.suspendRace(raceId, stewardReport);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race has been suspended. Status set to STOPPED."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/resume")
    public ResponseEntity<?> resumeRace(@PathVariable Integer raceId) {
        try {
            refereeService.resumeRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race has resumed. Status set to RUNNING."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/start")
    public ResponseEntity<?> startRace(@PathVariable Integer raceId) {
        try {
            refereeService.startRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race started successfully. Status is now RUNNING."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/violations/{violationId}/confirm")
    public ResponseEntity<?> confirmViolation(@PathVariable Integer violationId) {
        try {
            refereeService.confirmViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation confirmed."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/violations/{violationId}/dismiss")
    public ResponseEntity<?> dismissViolation(@PathVariable Integer violationId) {
        try {
            refereeService.dismissViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation dismissed."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/stop")
    public ResponseEntity<?> stopEntry(@PathVariable Integer entryId) {
        try {
            refereeService.stopEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has been stopped."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/resume")
    public ResponseEntity<?> resumeEntry(@PathVariable Integer entryId) {
        try {
            refereeService.resumeEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has resumed running."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/disqualify")
    public ResponseEntity<?> disqualifyEntry(@PathVariable Integer entryId) {
        try {
            refereeService.disqualifyEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has been disqualified."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
