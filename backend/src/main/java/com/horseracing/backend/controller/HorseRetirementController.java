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
        Authentication auth = SecurityContextHolder.getContext().getAuthentication(); // Lấy đối tượng xác thực Authentication từ SecurityContext
        if (auth == null || !auth.isAuthenticated()) { // Kiểm tra nếu phiên đăng nhập chưa được xác thực
            throw new SecurityException("Unauthorized"); // Ném ngoại lệ SecurityException từ chối truy cập
        }
        String username = auth.getName(); // Trích xuất tên người dùng từ thông tin xác thực
        return userRepository.findByUsername(username) // Truy vấn thông tin người dùng từ cơ sở dữ liệu
                .orElseThrow(() -> new IllegalArgumentException("User not found")); // Ném ngoại lệ nếu không tìm thấy người dùng
    }

    // Đăng ký đơn xin giải nghệ tự nguyện (Chủ ngựa gửi lên)
    @PostMapping("/request")
    @Operation(
        summary = "POST: Tạo đơn xin giải nghệ cho ngựa (Chủ ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `HorseRetirementController.requestRetirement()`\n" +
                      "* **Services**: `HorseRetirementService.requestRetirement()`\n" +
                      "* **Repositories**: `HorseRetirementRequestRepository.save()`\n" +
                      "* **Entities**: `HorseRetirementRequest.java`\n" +
                      "* **DTOs**: `RetirementRequestDTO` (`horseId`, `reason`), `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Request**: `RetirementRequestDTO` (`horseId`, `reason`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"request\": HorseRetirementRequestDTO}`)\n" +
                      "* **Frontend**: `HorseOwner.tsx` (dashboards), `horseRetirementService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Chủ ngựa gửi đơn xin giải nghệ kèm lý do cho chiến mã.\n" +
                      "2. Kiểm tra chiến mã thuộc quyền sở hữu của Chủ ngựa này.\n" +
                      "3. Tạo bản ghi `HorseRetirementRequest` với trạng thái `PENDING` chờ Admin duyệt."
    )
    public ResponseEntity<?> requestRetirement(@RequestBody RetirementRequestDTO body) {
        try { // Khối xử lý ngoại lệ khi gửi đơn xin giải nghệ
            User user = getAuthenticatedUser(); // Lấy đối tượng người dùng đang đăng nhập
            if (body.getReason() == null || body.getReason().trim().isEmpty()) { // Kiểm tra xem lý do xin giải nghệ có bị bỏ trống hay không
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Reason is required")); // Trả về HTTP 400 Bad Request nếu thiếu lý do
            }
            // Gọi dịch vụ khởi tạo đơn
            HorseRetirementRequestDTO dto = retirementService.requestRetirement(body.getHorseId(), user.getId(), body.getReason()); // Thực thi tạo đơn xin giải nghệ ở tầng service
            return ResponseEntity.ok(Map.of("success", true, "request", dto)); // Trả về HTTP 200 kèm DTO đơn xin giải nghệ vừa tạo
        } catch (Exception e) { // Bắt ngoại lệ nếu tạo đơn xin giải nghệ thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Lấy danh sách các đơn giải nghệ (Phân quyền: Admin xem tất cả, Chủ ngựa xem đơn của mình)
    @GetMapping("/requests")
    @Operation(
        summary = "GET: Lấy danh sách các đơn giải nghệ",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `HorseRetirementController.getRequests()`\n" +
                      "* **Services**: `HorseRetirementService.getAllRequests()` / `getRequestsByOwner()`\n" +
                      "* **Repositories**: `HorseRetirementRequestRepository.findAll()` / `findByOwnerId()`\n" +
                      "* **Entities**: `HorseRetirementRequest.java`\n" +
                      "* **DTOs**: `HorseRetirementRequestDTO`\n" +
                      "* **DTO Response**: `List<HorseRetirementRequestDTO>`\n" +
                      "* **Frontend**: `AdminHorseRetirement.tsx` (admin-workflow), `HorseOwner.tsx` (dashboards), `horseRetirementService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Admin: Lấy toàn bộ danh sách đơn giải nghệ chờ duyệt.\n" +
                      "2. Chủ ngựa: Lấy danh sách đơn giải nghệ của riêng mình."
    )
    public ResponseEntity<?> getRequests() {
        try { // Khối xử lý ngoại lệ khi tra cứu danh sách đơn giải nghệ
            User user = getAuthenticatedUser(); // Lấy người dùng đang xác thực
            List<HorseRetirementRequestDTO> list; // Khai báo biến danh sách kết quả DTO
            if (user.getRoleId() == 1) { // Phân quyền Admin (RoleId = 1)
                list = retirementService.getAllRequests(); // Admin xem được toàn bộ danh sách đơn giải nghệ
            } else if (user.getRoleId() == 2) { // Phân quyền Chủ ngựa (RoleId = 2)
                list = retirementService.getRequestsByOwner(user.getId()); // Chủ ngựa chỉ xem được danh sách đơn do mình tạo
            } else { // Trường hợp role khác không có quyền truy cập
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Forbidden")); // Trả về HTTP 403 Forbidden nếu không đủ quyền
            }
            return ResponseEntity.ok(list); // Trả về HTTP 200 kèm danh sách các đơn giải nghệ
        } catch (Exception e) { // Bắt ngoại lệ nếu tra cứu danh sách thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Phê duyệt đơn xin giải nghệ (Chỉ Admin)
    @PostMapping("/requests/{id}/approve")
    @Operation(
        summary = "POST: Phê duyệt đơn giải nghệ (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `HorseRetirementController.approveRequest()`\n" +
                      "* **Services**: `HorseRetirementService.approveRequest()`\n" +
                      "* **Repositories**: `HorseRetirementRequestRepository.save()`, `HorseRepository.save()`\n" +
                      "* **Entities**: `HorseRetirementRequest.java`, `Horse.java`\n" +
                      "* **DTOs**: `ApproveRetirementRequestDTO` (`adminRemarks`), `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Request**: `ApproveRetirementRequestDTO` (`adminRemarks`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `AdminHorseRetirement.tsx` (admin-workflow), `horseRetirementService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin xem xét và phê duyệt đơn giải nghệ theo `requestId`.\n" +
                      "2. Cập nhật trạng thái `HorseRetirementRequest` sang `APPROVED`.\n" +
                      "3. Đổi trạng thái chiến mã trong `HorseRepository` sang `RETIRED`."
    )
    public ResponseEntity<?> approveRequest(@PathVariable Integer id, @RequestBody(required = false) ApproveRetirementRequestDTO body) {
        try { // Khối xử lý ngoại lệ khi phê duyệt đơn giải nghệ
            User user = getAuthenticatedUser(); // Lấy người dùng thực hiện thao tác
            if (user.getRoleId() != 1) { // Bảo vệ phân quyền
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can approve requests")); // Trả về HTTP 403 Forbidden nếu không phải Admin
            }
            String adminRemarks = body != null ? body.getAdminRemarks() : null; // Lấy ghi chú của Admin nếu có truyền vào
            // Thực thi phê duyệt đơn
            retirementService.approveRequest(id, adminRemarks); // Gọi service thực hiện phê duyệt đơn giải nghệ
            return ResponseEntity.ok(Map.of("success", true, "message", "Retirement request approved successfully")); // Trả về HTTP 200 thông báo phê duyệt thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu phê duyệt thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm lý do lỗi
        }
    }

    // Từ chối đơn giải nghệ (Chỉ Admin)
    @PostMapping("/requests/{id}/reject")
    @Operation(
        summary = "POST: Từ chối đơn giải nghệ (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `HorseRetirementController.rejectRequest()`\n" +
                      "* **Services**: `HorseRetirementService.rejectRequest()`\n" +
                      "* **Repositories**: `HorseRetirementRequestRepository.save()`\n" +
                      "* **Entities**: `HorseRetirementRequest.java`\n" +
                      "* **DTOs**: `ApproveRetirementRequestDTO` (`adminRemarks`), `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Request**: `ApproveRetirementRequestDTO` (`adminRemarks`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `AdminHorseRetirement.tsx` (admin-workflow), `horseRetirementService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin từ chối đơn giải nghệ kèm lý do (`adminRemarks`).\n" +
                      "2. Cập nhật trạng thái `HorseRetirementRequest` sang `REJECTED`.\n" +
                      "3. Ngựa vẫn giữ nguyên trạng thái hiện tại."
    )
    public ResponseEntity<?> rejectRequest(@PathVariable Integer id, @RequestBody(required = false) ApproveRetirementRequestDTO body) {
        try { // Khối xử lý ngoại lệ khi từ chối đơn giải nghệ
            User user = getAuthenticatedUser(); // Lấy người dùng thực hiện thao tác
            if (user.getRoleId() != 1) { // Bảo vệ phân quyền
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can reject requests")); // Trả về HTTP 403 Forbidden nếu không phải Admin
            }
            String adminRemarks = body != null ? body.getAdminRemarks() : null; // Lấy lý do từ chối của Admin nếu có
            // Thực thi bác bỏ đơn
            retirementService.rejectRequest(id, adminRemarks); // Gọi service thực hiện từ chối đơn giải nghệ
            return ResponseEntity.ok(Map.of("success", true, "message", "Retirement request rejected successfully")); // Trả về HTTP 200 thông báo từ chối thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu xử lý từ chối thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Bắt buộc cưỡng chế giải nghệ ngựa (Quyết định hành chính từ Admin)
    @PostMapping("/compulsory")
    @Operation(
        summary = "POST: Bắt buộc giải nghệ chiến mã (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `HorseRetirementController.compulsoryRetire()`\n" +
                      "* **Services**: `HorseRetirementService.compulsoryRetire()`\n" +
                      "* **Repositories**: `HorseRetirementRequestRepository.save()`, `HorseRepository.save()`\n" +
                      "* **Entities**: `HorseRetirementRequest.java`, `Horse.java`\n" +
                      "* **DTOs**: `RetirementRequestDTO` (`horseId`, `reason`), `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Request**: `RetirementRequestDTO` (`horseId`, `reason`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"request\": HorseRetirementRequestDTO}`)\n" +
                      "* **Frontend**: `AdminHorseRetirement.tsx` (admin-workflow), `horseRetirementService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin bắt buộc giải nghệ chiến mã theo quyết định hành chính (chấn thương, tuổi cao).\n" +
                      "2. Tạo bản ghi `HorseRetirementRequest` với trạng thái `APPROVED` trực tiếp.\n" +
                      "3. Đổi trạng thái ngựa sang `RETIRED` ngay lập tức."
    )
    public ResponseEntity<?> compulsoryRetire(@RequestBody RetirementRequestDTO body) {
        try { // Khối xử lý ngoại lệ khi cưỡng chế giải nghệ ngựa
            User user = getAuthenticatedUser(); // Lấy thông tin người dùng đang đăng nhập
            if (user.getRoleId() != 1) { // Bảo vệ phân quyền
                return ResponseEntity.status(403).body(Map.of("success", false, "error", "Only Admin can perform compulsory retirement")); // Trả về HTTP 403 Forbidden nếu không phải Admin
            }
            if (body.getReason() == null || body.getReason().trim().isEmpty()) { // Kiểm tra lý do bắt buộc giải nghệ
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Reason is required")); // Trả về HTTP 400 Bad Request nếu lý do bị trống
            }
            // Gọi nghiệp vụ giải nghệ bắt buộc
            HorseRetirementRequestDTO dto = retirementService.compulsoryRetire(body.getHorseId(), body.getReason()); // Gọi service thực thi giải nghệ bắt buộc cho ngựa
            return ResponseEntity.ok(Map.of("success", true, "request", dto)); // Trả về HTTP 200 kèm DTO đơn giải nghệ cưỡng chế
        } catch (Exception e) { // Bắt ngoại lệ nếu cưỡng chế giải nghệ thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm lý do lỗi
        }
    }
}
