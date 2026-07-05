package com.horseracing.backend.controller;

import com.horseracing.backend.dto.HorseRetirementRequestDTO;
import com.horseracing.backend.entity.User;
import com.horseracing.backend.repository.UserRepository;
import com.horseracing.backend.service.HorseRetirementService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/retirement")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HorseRetirementController {

    private final HorseRetirementService retirementService;
    private final UserRepository userRepository;

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("Unauthorized");
        }
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    @PostMapping("/request")
    public ResponseEntity<?> requestRetirement(@RequestBody Map<String, Object> body) {
        try {
            User user = getAuthenticatedUser();
            Integer horseId = Integer.parseInt(String.valueOf(body.get("horseId")));
            String reason = (String) body.get("reason");

            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Reason is required"));
            }

            HorseRetirementRequestDTO dto = retirementService.requestRetirement(horseId, user.getId(), reason);
            return ResponseEntity.ok(Map.of("success", true, "request", dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/requests")
    public ResponseEntity<?> getRequests() {
        try {
            User user = getAuthenticatedUser();
            List<HorseRetirementRequestDTO> list;
            if (user.getRoleId() == 1) { // Admin
                list = retirementService.getAllRequests();
            } else if (user.getRoleId() == 2) { // Horse Owner
                list = retirementService.getRequestsByOwner(user.getId());
            } else {
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Forbidden"));
            }
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/requests/{id}/approve")
    public ResponseEntity<?> approveRequest(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            User user = getAuthenticatedUser();
            if (user.getRoleId() != 1) {
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can approve requests"));
            }
            String adminRemarks = (String) body.get("adminRemarks");
            retirementService.approveRequest(id, adminRemarks);
            return ResponseEntity.ok(Map.of("success", true, "message", "Retirement request approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/requests/{id}/reject")
    public ResponseEntity<?> rejectRequest(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            User user = getAuthenticatedUser();
            if (user.getRoleId() != 1) {
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can reject requests"));
            }
            String adminRemarks = (String) body.get("adminRemarks");
            retirementService.rejectRequest(id, adminRemarks);
            return ResponseEntity.ok(Map.of("success", true, "message", "Retirement request rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/compulsory")
    public ResponseEntity<?> compulsoryRetire(@RequestBody Map<String, Object> body) {
        try {
            User user = getAuthenticatedUser();
            if (user.getRoleId() != 1) {
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can perform compulsory retirement"));
            }
            Integer horseId = Integer.parseInt(String.valueOf(body.get("horseId")));
            String reason = (String) body.get("reason");

            if (reason == null || reason.trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Reason is required"));
            }

            HorseRetirementRequestDTO dto = retirementService.compulsoryRetire(horseId, reason);
            return ResponseEntity.ok(Map.of("success", true, "request", dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
