package com.horseracing.backend.controller;

import com.horseracing.backend.dto.HorseRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.JockeyRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.OwnerRaceMeetingRegistrationDTO;
import com.horseracing.backend.service.RegistrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping("/jockey")
    public ResponseEntity<?> registerJockey(@RequestBody Map<String, Integer> body) {
        try {
            Integer meetingId = body.get("meetingId");
            Integer jockeyId = body.get("jockeyId");
            JockeyRaceMeetingRegistrationDTO reg = registrationService.registerJockey(meetingId, jockeyId);
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/owner")
    public ResponseEntity<?> registerOwner(@RequestBody Map<String, Integer> body) {
        try {
            Integer meetingId = body.get("meetingId");
            Integer ownerId = body.get("ownerId");
            OwnerRaceMeetingRegistrationDTO reg = registrationService.registerOwner(meetingId, ownerId);
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/horse")
    public ResponseEntity<?> registerHorse(@RequestBody Map<String, Integer> body) {
        try {
            Integer meetingId = body.get("meetingId");
            Integer horseId = body.get("horseId");
            HorseRaceMeetingRegistrationDTO reg = registrationService.registerHorse(meetingId, horseId);
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
