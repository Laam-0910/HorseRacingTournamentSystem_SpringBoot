package com.horseracing.backend.controller;

import com.horseracing.backend.dto.HorseDTO;
import com.horseracing.backend.dto.RaceInvitationDTO;
import com.horseracing.backend.service.HorseService;
import com.horseracing.backend.service.InvitationService;
import com.horseracing.backend.service.JockeyOwnerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller HorseOwnerController - Lớp kiểm soát các endpoint dành cho Chủ ngựa (Horse Owner).
 * - Xem danh mục các ngựa đang sở hữu.
 * - Xem các lời mời gửi nài ngựa cưỡi thi đấu.
 * - Tải dữ liệu Dashboard chủ ngựa (doanh thu giải thưởng, thứ hạng trung bình, quy mô chuồng).
 * - Tra cứu lịch sử kết quả của các con ngựa thuộc chuồng.
 */
@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
public class HorseOwnerController {

    private final HorseService horseService; // Dịch vụ quản lý thông tin ngựa
    private final InvitationService invitationService; // Dịch vụ quản lý lời mời cưỡi ngựa
    private final JockeyOwnerDashboardService dashboardService; // Dịch vụ xử lý dữ liệu Dashboard kỵ sĩ/chủ ngựa
    private final com.horseracing.backend.service.RefereeService refereeService; // Dịch vụ quản lý xử lý vi phạm

    // Lấy danh sách toàn bộ ngựa thuộc sở hữu của chủ ngựa theo ID chủ ngựa
    @GetMapping("/{id}/horses")
        public ResponseEntity<List<HorseDTO>> getOwnerHorses(@PathVariable Integer id) {
        return ResponseEntity.ok(horseService.getAllHorses(null, id)); // Trả về HTTP 200 kèm danh sách ngựa thuộc sở hữu của chủ ngựa theo ID
    }

    // Lấy danh sách lời mời (invitations) do chủ ngựa này tạo ra gửi tới các kỵ sĩ
    @GetMapping("/{id}/invitations")
        public ResponseEntity<List<RaceInvitationDTO>> getOwnerInvitations(@PathVariable Integer id) {
        return ResponseEntity.ok(invitationService.getInvitations(null, id)); // Trả về HTTP 200 kèm danh sách lời mời thi đấu do chủ ngựa khởi tạo
    }

    // Lấy thông tin Dashboard của chủ ngựa (quy mô chuồng, tổng tiền thưởng, thứ hạng trung bình,...)
    @GetMapping("/{id}/dashboard")
        public ResponseEntity<Map<String, Object>> getOwnerDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerDashboard(id)); // Trả về HTTP 200 kèm dữ liệu thống kê tổng quan Dashboard của chủ ngựa
    }

    // Lấy thông tin chi tiết trạng thái hoạt động của chuồng ngựa hiện tại
    @GetMapping("/{id}/stable")
        public ResponseEntity<List<Map<String, Object>>> getOwnerStable(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerStable(id)); // Trả về HTTP 200 kèm danh sách chi tiết các chiến mã trong chuồng
    }

    // Lấy lịch sử kết quả thi đấu của các con ngựa thuộc chủ sở hữu này
    @GetMapping("/{id}/results")
        public ResponseEntity<List<Map<String, Object>>> getOwnerResults(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerResults(id)); // Trả về HTTP 200 kèm danh sách lịch sử kết quả thi đấu của các con ngựa thuộc chuồng
    }

    // Lấy danh sách vi phạm dành cho Chủ sở hữu ngựa
    @GetMapping("/{id}/violations")
    public ResponseEntity<List<Map<String, Object>>> getOwnerViolations(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerViolations(id));
    }

    // Chủ sở hữu ngựa xác nhận biên bản vi phạm
    @PostMapping("/violations/{violationId}/confirm")
    public ResponseEntity<?> confirmOwnerViolation(@PathVariable Integer violationId) {
        try {
            refereeService.confirmViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Owner violation acknowledged successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Chủ sở hữu ngựa nộp phạt trực tiếp cho vi phạm
    @PostMapping("/violations/{violationId}/pay")
    public ResponseEntity<?> payOwnerViolationFine(@PathVariable Integer violationId) {
        try {
            refereeService.confirmViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Owner penalty fine paid successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
