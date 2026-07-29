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

/**
 * Controller HorseRetirementController - Lớp kiểm soát các endpoint liên quan đến Giải nghệ chiến mã (Horse Retirement).
 * - Cho phép chủ ngựa gửi đơn xin giải nghệ tự nguyện (PENDING).
 * - Cho phép Admin phê duyệt (Approve) đơn, đổi trạng thái ngựa sang RETIRED.
 * - Cho phép Admin từ chối (Reject) đơn giải nghệ.
 * - Cho phép Admin thực thi cưỡng chế giải nghệ ngựa (Compulsory) do tuổi tác hoặc chấn thương.
 */
@RestController
@RequestMapping("/api/retirement")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
@Tag(
    name = "13. Horse Retirement Service",
    description = "🎗️ **BƯỚC 13: QUẢN LÝ GIẢI NGHỆ CHIẾN MÃ (RETIREMENT ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `HorseRetirementController.java`\n" +
                  "* **Services**: `HorseRetirementService.java`\n" +
                  "* **Repositories**: `HorseRetirementRequestRepository.java`, `HorseRepository.java`\n" +
                  "* **Entities**: `HorseRetirementRequest.java`, `Horse.java`\n" +
                  "* **DTOs**: `RetirementRequestDTO.java`, `ApproveRetirementRequestDTO.java`\n" +
                  "* **Frontend**: `AdminHorseRetirement.tsx` (admin-workflow), `HorseOwner.tsx` (dashboards)\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Chủ ngựa gửi đơn xin giải nghệ cho chiến mã.\n" +
                  "2. Admin duyệt (`approveRequest`) hoặc Từ chối (`rejectRequest`).\n" +
                  "3. Khi duyệt: Trạng thái ngựa đổi sang `RETIRED`."
)
public class HorseRetirementController {

    private final HorseRetirementService retirementService; // Dịch vụ giải nghệ chiến mã
    private final UserRepository userRepository; // Kho lưu trữ thông tin người dùng

    // Trích xuất thông tin người dùng đã xác thực từ Security Context
    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            throw new SecurityException("Unauthorized");
        }
        String username = auth.getName();
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
    }

    // Đăng ký đơn xin giải nghệ tự nguyện (Chủ ngựa gửi lên)
    @PostMapping("/request")
    @Operation(
        summary = "POST: Tạo đơn xin giải nghệ cho ngựa (Chủ ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseRetirementController.requestRetirement()`\n" +
                      "* **Service**: `HorseRetirementService.requestRetirement()`\n" +
                      "* **Repository**: `HorseRetirementRequestRepository.save()`\n" +
                      "* **Entity**: `HorseRetirementRequest.java`\n" +
                      "* **DTO Request**: `RetirementRequestDTO` (`horseId`, `reason`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"request\": HorseRetirementRequestDTO}`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Chủ ngựa gửi đơn xin giải nghệ kèm lý do cho chiến mã.\n" +
                      "2. Kiểm tra chiến mã thuộc quyền sở hữu của Chủ ngựa này.\n" +
                      "3. Tạo bản ghi `HorseRetirementRequest` với trạng thái `PENDING` chờ Admin duyệt."
    )
    public ResponseEntity<?> requestRetirement(@RequestBody RetirementRequestDTO body) {
        try {
            User user = getAuthenticatedUser();
            if (body.getReason() == null || body.getReason().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Reason is required"));
            }
            // Gọi dịch vụ khởi tạo đơn
            HorseRetirementRequestDTO dto = retirementService.requestRetirement(body.getHorseId(), user.getId(), body.getReason());
            return ResponseEntity.ok(Map.of("success", true, "request", dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Lấy danh sách các đơn giải nghệ (Phân quyền: Admin xem tất cả, Chủ ngựa xem đơn của mình)
    @GetMapping("/requests")
    @Operation(
        summary = "GET: Lấy danh sách các đơn giải nghệ",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> 'Execute' để lấy danh sách đơn giải nghệ.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseRetirementController.getRequests()`\n" +
                      "* **Service**: `HorseRetirementService.getAllRequests()` / `getRequestsByOwner()`\n" +
                      "* **Repository**: `HorseRetirementRequestRepository.findAll()` / `findByOwnerId()`\n" +
                      "* **Entity**: `HorseRetirementRequest.java`\n" +
                      "* **DTO Response**: `List<HorseRetirementRequestDTO>`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Admin: Lấy toàn bộ danh sách đơn giải nghệ chờ duyệt.\n" +
                      "2. Chủ ngựa: Lấy danh sách đơn giải nghệ của riêng mình."
    )
    public ResponseEntity<?> getRequests() {
        try {
            User user = getAuthenticatedUser();
            List<HorseRetirementRequestDTO> list;
            if (user.getRoleId() == 1) { // Phân quyền Admin
                list = retirementService.getAllRequests();
            } else if (user.getRoleId() == 2) { // Phân quyền Chủ ngựa
                list = retirementService.getRequestsByOwner(user.getId());
            } else {
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Forbidden"));
            }
            return ResponseEntity.ok(list);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Phê duyệt đơn xin giải nghệ (Chỉ Admin)
    @PostMapping("/requests/{id}/approve")
    @Operation(
        summary = "POST: Phê duyệt đơn giải nghệ (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseRetirementController.approveRequest()`\n" +
                      "* **Service**: `HorseRetirementService.approveRequest()`\n" +
                      "* **Repositories**: `HorseRetirementRequestRepository.save()`, `HorseRepository.save()`\n" +
                      "* **Entities**: `HorseRetirementRequest.java`, `Horse.java`\n" +
                      "* **DTO Request**: `ApproveRetirementRequestDTO` (`adminRemarks`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin xem xét và phê duyệt đơn giải nghệ theo `requestId`.\n" +
                      "2. Cập nhật trạng thái `HorseRetirementRequest` sang `APPROVED`.\n" +
                      "3. Đổi trạng thái chiến mã trong `HorseRepository` sang `RETIRED`."
    )
    public ResponseEntity<?> approveRequest(@PathVariable Integer id, @RequestBody(required = false) ApproveRetirementRequestDTO body) {
        try {
            User user = getAuthenticatedUser();
            if (user.getRoleId() != 1) { // Bảo vệ phân quyền
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can approve requests"));
            }
            String adminRemarks = body != null ? body.getAdminRemarks() : null;
            // Thực thi phê duyệt đơn
            retirementService.approveRequest(id, adminRemarks);
            return ResponseEntity.ok(Map.of("success", true, "message", "Retirement request approved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Từ chối đơn giải nghệ (Chỉ Admin)
    @PostMapping("/requests/{id}/reject")
    @Operation(
        summary = "POST: Từ chối đơn giải nghệ (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseRetirementController.rejectRequest()`\n" +
                      "* **Service**: `HorseRetirementService.rejectRequest()`\n" +
                      "* **Repository**: `HorseRetirementRequestRepository.save()`\n" +
                      "* **Entity**: `HorseRetirementRequest.java`\n" +
                      "* **DTO Request**: `ApproveRetirementRequestDTO` (`adminRemarks`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin từ chối đơn giải nghệ kèm lý do (`adminRemarks`).\n" +
                      "2. Cập nhật trạng thái `HorseRetirementRequest` sang `REJECTED`.\n" +
                      "3. Ngựa vẫn giữ nguyên trạng thái hiện tại."
    )
    public ResponseEntity<?> rejectRequest(@PathVariable Integer id, @RequestBody(required = false) ApproveRetirementRequestDTO body) {
        try {
            User user = getAuthenticatedUser();
            if (user.getRoleId() != 1) { // Bảo vệ phân quyền
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can reject requests"));
            }
            String adminRemarks = body != null ? body.getAdminRemarks() : null;
            // Thực thi bác bỏ đơn
            retirementService.rejectRequest(id, adminRemarks);
            return ResponseEntity.ok(Map.of("success", true, "message", "Retirement request rejected successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Bắt buộc cưỡng chế giải nghệ ngựa (Quyết định hành chính từ Admin)
    @PostMapping("/compulsory")
    @Operation(
        summary = "POST: Bắt buộc giải nghệ chiến mã (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseRetirementController.compulsoryRetire()`\n" +
                      "* **Service**: `HorseRetirementService.compulsoryRetire()`\n" +
                      "* **Repositories**: `HorseRetirementRequestRepository.save()`, `HorseRepository.save()`\n" +
                      "* **DTO Request**: `RetirementRequestDTO` (`horseId`, `reason`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin bắt buộc giải nghệ chiến mã theo quyết định hành chính (chấn thương, tuổi cao).\n" +
                      "2. Tạo bản ghi `HorseRetirementRequest` với trạng thái `APPROVED` trực tiếp.\n" +
                      "3. Đổi trạng thái ngựa sang `RETIRED` ngay lập tức."
    )
    public ResponseEntity<?> compulsoryRetire(@RequestBody RetirementRequestDTO body) {
        try {
            User user = getAuthenticatedUser();
            if (user.getRoleId() != 1) { // Bảo vệ phân quyền
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can perform compulsory retirement"));
            }
            if (body.getReason() == null || body.getReason().trim().isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Reason is required"));
            }
            // Gọi nghiệp vụ giải nghệ bắt buộc
            HorseRetirementRequestDTO dto = retirementService.compulsoryRetire(body.getHorseId(), body.getReason());
            return ResponseEntity.ok(Map.of("success", true, "request", dto));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
