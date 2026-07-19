package com.horseracing.backend.controller;

import com.horseracing.backend.dto.HorseDTO;
import com.horseracing.backend.service.HorseService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Horse Service", description = "Quản lý danh sách chiến mã, đăng ký và duyệt ngựa")
public class HorseController {

    private final HorseService horseService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả các con ngựa", description = "📌 **Code Handler**: `HorseController.getAllHorses()` -> `HorseService.getAllHorses()`")
    public ResponseEntity<List<HorseDTO>> getAllHorses(@RequestParam(required = false) String status,
                                                       @RequestParam(required = false) Integer ownerId) {
        return ResponseEntity.ok(horseService.getAllHorses(status, ownerId));
    }

    @PostMapping
    @Operation(summary = "Đăng ký ngựa mới", description = "📌 **Code Handler**: `HorseController.registerHorse()` -> `HorseService.registerHorse()`")
    public ResponseEntity<?> registerHorse(@RequestBody HorseDTO horseDTO) {
        try {
            HorseDTO savedHorse = horseService.registerHorse(horseDTO);
            return ResponseEntity.ok(Map.of("success", true, "horse", savedHorse));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/approve")
    @Operation(summary = "Phê duyệt hồ sơ ngựa (Admin)", description = "📌 **Code Handler**: `HorseController.approveHorse()` -> `HorseService.approveHorse()`")
    public ResponseEntity<?> approveHorse(@PathVariable Integer id) {
        try {
            horseService.approveHorse(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối hồ sơ ngựa (Admin)", description = "📌 **Code Handler**: `HorseController.rejectHorse()` -> `HorseService.rejectHorse()`")
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
    @Operation(summary = "Cập nhật thông tin ngựa", description = "📌 **Code Handler**: `HorseController.updateHorse()` -> `HorseService.updateHorse()`")
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
