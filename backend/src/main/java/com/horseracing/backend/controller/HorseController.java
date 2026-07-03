package com.horseracing.backend.controller;

import com.horseracing.backend.dto.HorseDTO;
import com.horseracing.backend.service.HorseService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/horses")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HorseController {

    private final HorseService horseService;

    @GetMapping
    public ResponseEntity<List<HorseDTO>> getAllHorses(@RequestParam(required = false) String status,
                                                       @RequestParam(required = false) Integer ownerId) {
        return ResponseEntity.ok(horseService.getAllHorses(status, ownerId));
    }

    @PostMapping
    public ResponseEntity<?> registerHorse(@RequestBody HorseDTO horseDTO) {
        try {
            HorseDTO savedHorse = horseService.registerHorse(horseDTO);
            return ResponseEntity.ok(Map.of("success", true, "horse", savedHorse));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<?> approveHorse(@PathVariable Integer id) {
        try {
            horseService.approveHorse(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectHorse(@PathVariable Integer id) {
        try {
            horseService.rejectHorse(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @Autowired
    private com.horseracing.backend.repository.UserRepository userRepository;

    @PutMapping("/{id}")
    public ResponseEntity<?> updateHorse(@PathVariable Integer id, @RequestBody HorseDTO horseDTO) {
        try {
            org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                return ResponseEntity.status(401).body(Map.of("success", false, "error", "Unauthorized"));
            }
            String username = auth.getName();
            com.horseracing.backend.entity.User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            HorseDTO updated = horseService.updateHorse(id, horseDTO, user.getId(), user.getRoleId());
            return ResponseEntity.ok(Map.of("success", true, "horse", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
