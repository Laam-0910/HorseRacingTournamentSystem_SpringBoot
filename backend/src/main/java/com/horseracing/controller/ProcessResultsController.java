package com.horseracing.backend.controller;

import com.horseracing.backend.service.ProcessResultsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class ProcessResultsController {

    private final ProcessResultsService processResultsService;

    @PostMapping("/confirm")
    public ResponseEntity<?> confirmResults(@RequestBody Map<String, Object> request) {
        try {
            Integer raceId = (Integer) request.get("raceId");
            String stewardReport = (String) request.get("stewardReport");
            List<Map<String, Object>> entriesResults = (List<Map<String, Object>>) request.get("results");

            processResultsService.confirmResults(raceId, stewardReport, entriesResults);
            return ResponseEntity.ok(Map.of("success", true, "message", "Results processed successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
