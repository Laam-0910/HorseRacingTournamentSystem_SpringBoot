package com.horseracing.backend.controller;

import com.horseracing.backend.dto.RaceInvitationDTO;
import com.horseracing.backend.service.InvitationService;
import com.horseracing.backend.service.JockeyOwnerDashboardService;
import com.horseracing.backend.service.RefereeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller JockeyController - Lớp kiểm soát các endpoint dành riêng cho kỵ sĩ/nài ngựa (Jockey).
 * - Xem danh sách lời mời cưỡi ngựa từ chủ ngựa.
 * - Xem thống kê hiệu suất cá nhân trên Dashboard (tỷ lệ thắng, số lượt đua...).
 * - Xem danh sách các lượt cưỡi thi đấu thực tế.
 * - Xem và ký xác nhận các biên bản vi phạm luật do trọng tài lập.
 */
@RestController // Đánh dấu lớp này là một Spring REST Controller để nhận và xử lý HTTP Request
@RequestMapping("/api/jockey") // Thiết lập tiền tố URL cho các API trong controller này
@RequiredArgsConstructor // Khởi tạo constructor tự động cho các biến final (Dependency Injection)
@CrossOrigin(origins = "*") // Hỗ trợ CORS cho phép truy cập từ mọi địa chỉ frontend
public class JockeyController {

    private final InvitationService invitationService; // Dịch vụ quản lý lời mời thi đấu
    private final JockeyOwnerDashboardService dashboardService; // Dịch vụ tổng hợp dữ liệu Dashboard cho nài ngựa và chủ ngựa
    private final RefereeService refereeService; // Dịch vụ trọng tài (quản lý xử lý vi phạm)

    private final com.horseracing.backend.repository.UserRepository userRepository;

    // Lấy danh sách toàn bộ lời mời cưỡi ngựa của kỵ sĩ hiện tại theo ID tài khoản
    @GetMapping("/{id}/invitations") // Tiếp nhận HTTP GET request gửi tới /api/jockey/{id}/invitations
        public ResponseEntity<List<RaceInvitationDTO>> getJockeyInvitations(@PathVariable Integer id) {
        // Truy vấn dịch vụ lời mời theo ID kỵ sĩ và trả về mã HTTP 200 OK cùng danh sách DTO
        return ResponseEntity.ok(invitationService.getInvitations(id, null));
    }

    // Lấy thông tin thống kê hiệu suất thi đấu hiển thị trên Dashboard của kỵ sĩ
    @GetMapping("/{id}/dashboard") // Tiếp nhận HTTP GET request gửi tới /api/jockey/{id}/dashboard
        public ResponseEntity<Map<String, Object>> getJockeyDashboard(@PathVariable Integer id) {
        // Gọi dịch vụ dashboardService để lấy dữ liệu thống kê tổng quan của kỵ sĩ
        return ResponseEntity.ok(dashboardService.getJockeyDashboard(id));
    }

    // Lấy thông tin chi tiết về các trận đấu mà kỵ sĩ này được đăng ký tham gia (Mounts)
    @GetMapping("/{id}/mounts") // Tiếp nhận HTTP GET request gửi tới /api/jockey/{id}/mounts
        public ResponseEntity<List<Map<String, Object>>> getJockeyMounts(@PathVariable Integer id) {
        // Lấy danh sách lượt cưỡi thi đấu của kỵ sĩ từ dịch vụ và trả về client
        return ResponseEntity.ok(dashboardService.getJockeyMounts(id));
    }

    // Lấy danh sách vi phạm của kỵ sĩ này do trọng tài ghi nhận trong quá trình thi đấu
    @GetMapping("/{id}/violations") // Tiếp nhận HTTP GET request gửi tới /api/jockey/{id}/violations
        public ResponseEntity<List<Map<String, Object>>> getJockeyViolations(@PathVariable Integer id) {
        // Truy vấn danh sách các vi phạm liên quan đến ID nài ngựa và trả về kết quả
        return ResponseEntity.ok(dashboardService.getJockeyViolations(id));
    }

    // Kỵ sĩ cập nhật Giá Trị Bản Thân / Phí Thuê Nài (Jockey Fee)
    @PostMapping("/{id}/fee")
    public ResponseEntity<?> updateJockeyFee(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            java.math.BigDecimal fee = new java.math.BigDecimal(body.get("jockeyFee").toString());
            if (fee.compareTo(java.math.BigDecimal.ZERO) < 0) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Jockey fee cannot be negative"));
            }
            com.horseracing.backend.entity.User jockey = userRepository.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Jockey not found"));
            jockey.setJockeyFee(fee);
            userRepository.save(jockey);
            return ResponseEntity.ok(Map.of("success", true, "jockeyFee", fee));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Kỵ sĩ ký xác nhận hoặc thanh toán nộp phạt biên bản vi phạm
    @PostMapping("/violations/{violationId}/confirm") // Tiếp nhận HTTP POST request gửi tới /api/jockey/violations/{violationId}/confirm
    public ResponseEntity<?> confirmViolation(@PathVariable Integer violationId) {
        try {
            // Xác nhận biên bản vi phạm ở tầng nghiệp vụ trọng tài
            refereeService.confirmViolation(violationId);
            // Trả về phản hồi thành công xác nhận đã nhận biên bản vi phạm
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation acknowledged and fine processed successfully"));
        } catch (Exception e) {
            // Phản hồi lỗi nếu vi phạm không tồn tại hoặc gặp lỗi xử lý
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Kỵ sĩ thực hiện nộp phạt trực tiếp cho vi phạm chưa nộp phạt
    @PostMapping("/violations/{violationId}/pay")
    public ResponseEntity<?> payViolationFine(@PathVariable Integer violationId) {
        try {
            refereeService.confirmViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Penalty fine paid successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
