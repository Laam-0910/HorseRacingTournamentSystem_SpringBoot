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
    name = "08. Invitation & Jockey Service",
    description = "🤠 **DỊCH VỤ DÀNH CHO NÀI NGỰA (JOCKEY ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `JockeyController.java`, `InvitationController.java`\n" +
                  "* **Services**: `JockeyOwnerDashboardService.java`, `InvitationService.java`, `RefereeService.java`\n" +
                  "* **Repositories**: `RaceInvitationRepository.java`, `RaceEntryRepository.java`, `ViolationRepository.java`\n" +
                  "* **Entities**: `User.java` (roleId = 3), `RaceInvitation.java`, `Violation.java`"
)
public class JockeyController {

    private final InvitationService invitationService;
    private final JockeyOwnerDashboardService dashboardService;
    private final RefereeService refereeService;

    @GetMapping("/{id}/invitations")
    @Operation(summary = "GET: Lấy danh sách lời mời thi đấu của Nài ngựa", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền id Nài -> 'Execute'.\n\n📌 **Code Architecture**: `JockeyController.getJockeyInvitations()` -> `InvitationService.getInvitations()`")
    public ResponseEntity<List<RaceInvitationDTO>> getJockeyInvitations(@PathVariable Integer id) {
        return ResponseEntity.ok(invitationService.getInvitations(id, null));
    }

    @GetMapping("/{id}/dashboard")
    @Operation(summary = "GET: Lấy dữ liệu Dashboard cá nhân Nài ngựa", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền id Nài -> 'Execute'.\n\n📌 **Code Architecture**: `JockeyController.getJockeyDashboard()` -> `JockeyOwnerDashboardService.getJockeyDashboard()`")
    public ResponseEntity<Map<String, Object>> getJockeyDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyDashboard(id));
    }

    @GetMapping("/{id}/mounts")
    @Operation(summary = "GET: Lấy danh sách các lượt cưỡi thi đấu của Nài ngựa", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền id Nài -> 'Execute'.\n\n📌 **Code Architecture**: `JockeyController.getJockeyMounts()` -> `JockeyOwnerDashboardService.getJockeyMounts()`")
    public ResponseEntity<List<Map<String, Object>>> getJockeyMounts(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyMounts(id));
    }

    @GetMapping("/{id}/violations")
    @Operation(summary = "GET: Lấy danh sách lỗi vi phạm thi đấu của Nài ngựa", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền id Nài -> 'Execute'.\n\n📌 **Code Architecture**: `JockeyController.getJockeyViolations()` -> `JockeyOwnerDashboardService.getJockeyViolations()`")
    public ResponseEntity<List<Map<String, Object>>> getJockeyViolations(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyViolations(id));
    }

    @PostMapping("/violations/{violationId}/confirm")
    @Operation(summary = "POST: Xác nhận nhận biên bản vi phạm", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `JockeyController.confirmViolation()` -> `RefereeService.confirmViolation()`")
    public ResponseEntity<?> confirmViolation(@PathVariable Integer violationId) {
        try {
            refereeService.confirmViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation acknowledged successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
