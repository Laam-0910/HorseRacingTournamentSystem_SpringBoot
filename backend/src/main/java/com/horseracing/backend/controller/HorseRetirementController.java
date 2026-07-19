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
    name = "Horse Retirement Service",
    description = "🎗️ **Cấu trúc Mô-đun Giải Nghệ Chiến Mã (Horse Retirement Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `HorseRetirementController.java`\n" +
                  "* **Services**: `HorseRetirementService.java` (`HorseRetirementServiceImpl.java`)\n" +
                  "* **Repositories**: `HorseRetirementRequestRepository.java`, `HorseRepository.java`\n" +
                  "* **Entities**: `HorseRetirementRequest.java`, `Horse.java`\n" +
                  "* **DTOs**: `RetirementRequestDTO.java`, `ApproveRetirementRequestDTO.java`, `HorseRetirementRequestDTO.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Chủ ngựa nộp đơn xin giải nghệ cho chiến mã kèm lý do.\n" +
                  "2. Admin xem xét và phê duyệt (`APPROVE`) hoặc từ chối (`REJECT`).\n" +
                  "3. Nếu phê duyệt: Trạng thái ngựa đổi sang `RETIRED` và ngưng tham gia giải đua."
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
    @Operation(
        summary = "Tạo đơn xin giải nghệ cho ngựa (Chủ ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseRetirementController.requestRetirement()`\n" +
                      "* **Service**: `HorseRetirementService.requestRetirement()` (`HorseRetirementServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRetirementRequestRepository.save()`\n" +
                      "* **Entity**: `HorseRetirementRequest.java`\n" +
                      "* **DTO Request**: `RetirementRequestDTO` (`horseId`, `reason`)\n" +
                      "* **DTO Response**: `HorseRetirementRequestDTO`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Chủ ngựa chọn chiến mã và nhập lý do giải nghệ (chấn thương, tuổi tác...).\n" +
                      "2. Lưu đơn giải nghệ ở trạng thái `PENDING` chờ Admin duyệt."
    )
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
    @Operation(
        summary = "Lấy danh sách các đơn giải nghệ",
        description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute' để xem danh sách đơn giải nghệ.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseRetirementController.getRequests()`\n" +
                      "* **Service**: `HorseRetirementService.getAllRequests()` / `getRequestsByOwner()`\n" +
                      "* **Repository**: `HorseRetirementRequestRepository.findAll()`\n" +
                      "* **DTO Response**: `List<HorseRetirementRequestDTO>`"
    )
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
    @Operation(
        summary = "Phê duyệt đơn giải nghệ (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseRetirementController.approveRequest()`\n" +
                      "* **Service**: `HorseRetirementService.approveRequest()` (`HorseRetirementServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRepository.save()`, `HorseRetirementRequestRepository.save()`\n" +
                      "* **DTO Request**: `ApproveRetirementRequestDTO` (`adminRemarks`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin chấp thuận đơn giải nghệ.\n" +
                      "2. Cập nhật trạng thái `Horse.status = RETIRED` và lưu nhận xét của Admin."
    )
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
    @Operation(
        summary = "Từ chối đơn giải nghệ (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseRetirementController.rejectRequest()`\n" +
                      "* **Service**: `HorseRetirementService.rejectRequest()` (`HorseRetirementServiceImpl.java`)\n" +
                      "* **DTO Request**: `ApproveRetirementRequestDTO` (`adminRemarks`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin từ chối đơn giải nghệ.\n" +
                      "2. Chiến mã giữ nguyên trạng thái `ACTIVE`."
    )
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
    @Operation(
        summary = "Bắt buộc giải nghệ chiến mã (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseRetirementController.compulsoryRetire()`\n" +
                      "* **Service**: `HorseRetirementService.compulsoryRetire()` (`HorseRetirementServiceImpl.java`)\n" +
                      "* **DTO Request**: `RetirementRequestDTO` (`horseId`, `reason`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin trực tiếp cưỡng chế giải nghệ 1 con ngựa do vi phạm nghiêm trọng hoặc lý do đặc biệt."
    )
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
