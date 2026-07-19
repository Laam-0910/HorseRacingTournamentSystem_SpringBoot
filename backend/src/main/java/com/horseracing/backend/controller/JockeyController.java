package com.horseracing.backend.controller;

import com.horseracing.backend.dto.RaceInvitationDTO;
import com.horseracing.backend.service.InvitationService;
import com.horseracing.backend.service.JockeyOwnerDashboardService;
import com.horseracing.backend.service.RefereeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/jockey")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(
    name = "Jockey Service",
    description = "🤠 **Cấu trúc Mô-đun Quản lý Nài Ngựa (Jockey Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `JockeyController.java`, `InvitationController.java`\n" +
                  "* **Services**: `JockeyOwnerDashboardService.java`, `InvitationService.java`, `RefereeService.java`\n" +
                  "* **Repositories**: `RaceInvitationRepository.java`, `RaceEntryRepository.java`, `ViolationRepository.java`\n" +
                  "* **Entities**: `User.java` (roleId = 3), `RaceInvitation.java`, `Violation.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Nài ngựa nhận lời mời thi đấu từ các Chủ ngựa -> Chấp nhận (`ACCEPT`) hoặc Từ chối (`REJECT`).\n" +
                  "2. Khi chấp nhận, hệ thống tự động tạo đơn tham gia `RaceEntry` và xếp Nài ngựa vào danh sách thi đấu của trận đó.\n" +
                  "3. Nài ngựa theo dõi số lần cưỡi (`Mounts`), tỷ lệ thắng (`Win Rate`), tỷ lệ Top 3 và nhận tạ gánh chì được phân công.\n" +
                  "4. Theo dõi và xác nhận các biên bản lỗi vi phạm (`Violation`) do Trọng tài ghi nhận trên đường đua."
)
public class JockeyController {

    private final InvitationService invitationService;
    private final JockeyOwnerDashboardService dashboardService;
    private final RefereeService refereeService;

    @GetMapping("/{id}/invitations")
    @Operation(summary = "Lấy danh sách lời mời thi đấu của Nài ngựa", description = "📌 **Code Architecture**: `JockeyController.getJockeyInvitations()` -> `InvitationService.getInvitations(jockeyId, null)` -> `RaceInvitationRepository.findByJockeyId()`")
    public ResponseEntity<List<RaceInvitationDTO>> getJockeyInvitations(@PathVariable Integer id) {
        return ResponseEntity.ok(invitationService.getInvitations(id, null));
    }

    @GetMapping("/{id}/dashboard")
    @Operation(summary = "Lấy dữ liệu Dashboard cá nhân Nài ngựa", description = "📌 **Code Architecture**: `JockeyController.getJockeyDashboard()` -> `JockeyOwnerDashboardService.getJockeyDashboard()` -> Tính Win Rate, Top 3 Rate, Cân nặng")
    public ResponseEntity<Map<String, Object>> getJockeyDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyDashboard(id));
    }

    @GetMapping("/{id}/mounts")
    @Operation(summary = "Lấy danh sách các lượt cưỡi thi đấu của Nài ngựa", description = "📌 **Code Architecture**: `JockeyController.getJockeyMounts()` -> `JockeyOwnerDashboardService.getJockeyMounts()` -> Truy vấn các `RaceEntry` đã gán cho Nài ngựa")
    public ResponseEntity<List<Map<String, Object>>> getJockeyMounts(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyMounts(id));
    }

    @GetMapping("/{id}/violations")
    @Operation(summary = "Lấy danh sách lỗi vi phạm thi đấu của Nài ngựa", description = "📌 **Code Architecture**: `JockeyController.getJockeyViolations()` -> `JockeyOwnerDashboardService.getJockeyViolations()` -> `ViolationRepository.findByJockeyId()`")
    public ResponseEntity<List<Map<String, Object>>> getJockeyViolations(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyViolations(id));
    }

    @PostMapping("/violations/{violationId}/confirm")
    @Operation(summary = "Xác nhận nhận biên bản vi phạm", description = "📌 **Code Architecture**: `JockeyController.confirmViolation()` -> `RefereeService.confirmViolation()` -> Cập nhật trạng thái vi phạm sang `CONFIRMED`")
    public ResponseEntity<?> confirmViolation(@PathVariable Integer violationId) {
        try {
            refereeService.confirmViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation acknowledged successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
