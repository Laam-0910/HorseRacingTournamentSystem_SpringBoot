package com.horseracing.backend.controller;

import com.horseracing.backend.dto.HorseRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.JockeyRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.OwnerRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.RegistrationMeetingRequestDTO;
import com.horseracing.backend.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Registration Service", description = "Đăng ký tham gia Ngày đua cho Nài ngựa, Chủ ngựa và Ngựa")
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping("/jockey")
    @Operation(summary = "Nài ngựa đăng ký tham gia Ngày đua", description = "📌 **Code Handler**: `RegistrationController.registerJockey()` -> `RegistrationService.registerJockey()`")
    public ResponseEntity<?> registerJockey(@RequestBody RegistrationMeetingRequestDTO body) {
        try {
            JockeyRaceMeetingRegistrationDTO reg = registrationService.registerJockey(body.getMeetingId(), body.getJockeyId());
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/owner")
    @Operation(summary = "Chủ ngựa đăng ký tham gia Ngày đua", description = "📌 **Code Handler**: `RegistrationController.registerOwner()` -> `RegistrationService.registerOwner()`")
    public ResponseEntity<?> registerOwner(@RequestBody RegistrationMeetingRequestDTO body) {
        try {
            OwnerRaceMeetingRegistrationDTO reg = registrationService.registerOwner(body.getMeetingId(), body.getOwnerId());
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/horse")
    @Operation(summary = "Ngựa đăng ký tham gia Ngày đua", description = "📌 **Code Handler**: `RegistrationController.registerHorse()` -> `RegistrationService.registerHorse()`")
    public ResponseEntity<?> registerHorse(@RequestBody RegistrationMeetingRequestDTO body) {
        try {
            HorseRaceMeetingRegistrationDTO reg = registrationService.registerHorse(body.getMeetingId(), body.getHorseId());
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
