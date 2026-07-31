package com.horseracing.backend.controller;

import com.horseracing.backend.dto.ApproveRetirementRequestDTO;
import com.horseracing.backend.dto.HorseRetirementRequestDTO;
import com.horseracing.backend.dto.RetirementRequestDTO;
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
