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
@Tag(
    name = "13. Horse Retirement Service",
    description = "🎗️ **BƯỚC 13: QUẢN LÝ GIẢI NGHỆ CHIẾN MÃ (RETIREMENT ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `HorseRetirementController.java`\n" +
                  "* **Services**: `HorseRetirementService.java` (`HorseRetirementServiceImpl.java`)\n" +
                  "* **Repositories**: `HorseRetirementRequestRepository.java`, `HorseRepository.java`\n" +
                  "* **Entities**: `HorseRetirementRequest.java`, `Horse.java`\n" +
                  "* **DTOs**: `RetirementRequestDTO.java`, `ApproveRetirementRequestDTO.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Chủ ngựa gửi đơn xin giải nghệ cho chiến mã.\n" +
                  "2. Admin duyệt (`approveRequest`) hoặc Từ chối (`rejectRequest`).\n" +
                  "3. Khi duyệt: Trạng thái ngựa đổi sang `RETIRED`."
)
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
    @Operation(summary = "POST: Tạo đơn xin giải nghệ cho ngựa (Chủ ngựa)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `HorseRetirementController.requestRetirement()` -> `HorseRetirementService.requestRetirement()`")
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
    @Operation(summary = "GET: Lấy danh sách các đơn giải nghệ", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute'.\n\n📌 **Code Architecture**: `HorseRetirementController.getRequests()` -> `HorseRetirementService.getAllRequests()`")
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
    @Operation(summary = "POST: Phê duyệt đơn giải nghệ (Admin)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `HorseRetirementController.approveRequest()` -> `HorseRetirementService.approveRequest()`")
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
    @Operation(summary = "POST: Từ chối đơn giải nghệ (Admin)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `HorseRetirementController.rejectRequest()` -> `HorseRetirementService.rejectRequest()`")
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
    @Operation(summary = "POST: Bắt buộc giải nghệ chiến mã (Admin)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `HorseRetirementController.compulsoryRetire()` -> `HorseRetirementService.compulsoryRetire()`")
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
