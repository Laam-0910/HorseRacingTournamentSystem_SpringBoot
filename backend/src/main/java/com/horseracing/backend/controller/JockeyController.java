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
@Tag(name = "Jockey Service", description = "Dịch vụ Nài ngựa: Xem lời mời, Lịch thi đấu, Lỗi vi phạm")
public class JockeyController {

    private final InvitationService invitationService;
    private final JockeyOwnerDashboardService dashboardService;
    private final RefereeService refereeService;

    @GetMapping("/{id}/invitations")
    @Operation(summary = "Lấy danh sách lời mời thi đấu của Nài ngựa")
    public ResponseEntity<List<RaceInvitationDTO>> getJockeyInvitations(@PathVariable Integer id) {
        return ResponseEntity.ok(invitationService.getInvitations(id, null));
    }

    @GetMapping("/{id}/dashboard")
    @Operation(summary = "Lấy dữ liệu Dashboard cá nhân Nài ngựa")
    public ResponseEntity<Map<String, Object>> getJockeyDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyDashboard(id));
    }

    @GetMapping("/{id}/mounts")
    @Operation(summary = "Lấy danh sách các lượt cưỡi thi đấu của Nài ngựa")
    public ResponseEntity<List<Map<String, Object>>> getJockeyMounts(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyMounts(id));
    }

    @GetMapping("/{id}/violations")
    @Operation(summary = "Lấy danh sách lỗi vi phạm thi đấu của Nài ngựa")
    public ResponseEntity<List<Map<String, Object>>> getJockeyViolations(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyViolations(id));
    }

    @PostMapping("/violations/{violationId}/confirm")
    @Operation(summary = "Xác nhận nhận biên bản vi phạm")
    public ResponseEntity<?> confirmViolation(@PathVariable Integer violationId) {
        try {
            refereeService.confirmViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation acknowledged successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
