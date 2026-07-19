package com.horseracing.backend.controller;

import com.horseracing.backend.dto.ApproveRetirementRequestDTO;
import com.horseracing.backend.dto.HorseRetirementRequestDTO;
import com.horseracing.backend.dto.RetirementRequestDTO;
import com.horseracing.backend.entity.User;
import com.horseracing.backend.repository.UserRepository;
import com.horseracing.backend.service.HorseRetirementService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Horse Retirement Service", description = "Quản lý đơn xin giải nghệ cho chiến mã")
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
    @Operation(summary = "Tạo đơn xin giải nghệ cho ngựa (Chủ ngựa)")
    public ResponseEntity<?> requestRetirement(@RequestBody RetirementRequestDTO body) {
        try {
            User user = getAuthenticatedUser();
            if (body.getReason() == null || body.getReason().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Reason is required"));
            }

            HorseRetirementRequestDTO dto = retirementService.requestRetirement(body.getHorseId(), user.getId(), body.getReason());
            return ResponseEntity.ok(Map.of("success", true, "request", dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/requests")
    @Operation(summary = "Lấy danh sách các đơn giải nghệ")
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
    @Operation(summary = "Phê duyệt đơn giải nghệ (Admin)")
    public ResponseEntity<?> approveRequest(@PathVariable Integer id, @RequestBody(required = false) ApproveRetirementRequestDTO body) {
        try {
            User user = getAuthenticatedUser();
            if (user.getRoleId() != 1) {
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can approve requests"));
            }
            String adminRemarks = body != null ? body.getAdminRemarks() : null;
            retirementService.approveRequest(id, adminRemarks);
            return ResponseEntity.ok(Map.of("success", true, "message", "Retirement request approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/requests/{id}/reject")
    @Operation(summary = "Từ chối đơn giải nghệ (Admin)")
    public ResponseEntity<?> rejectRequest(@PathVariable Integer id, @RequestBody(required = false) ApproveRetirementRequestDTO body) {
        try {
            User user = getAuthenticatedUser();
            if (user.getRoleId() != 1) {
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can reject requests"));
            }
            String adminRemarks = body != null ? body.getAdminRemarks() : null;
            retirementService.rejectRequest(id, adminRemarks);
            return ResponseEntity.ok(Map.of("success", true, "message", "Retirement request rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/compulsory")
    @Operation(summary = "Bắt buộc giải nghệ chiến mã (Admin)")
    public ResponseEntity<?> compulsoryRetire(@RequestBody RetirementRequestDTO body) {
        try {
            User user = getAuthenticatedUser();
            if (user.getRoleId() != 1) {
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can perform compulsory retirement"));
            }
            if (body.getReason() == null || body.getReason().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Reason is required"));
            }

            HorseRetirementRequestDTO dto = retirementService.compulsoryRetire(body.getHorseId(), body.getReason());
            return ResponseEntity.ok(Map.of("success", true, "request", dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
