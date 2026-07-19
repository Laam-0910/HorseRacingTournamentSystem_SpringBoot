package com.horseracing.backend.controller;

import com.horseracing.backend.dto.HorseDTO;
import com.horseracing.backend.dto.RaceInvitationDTO;
import com.horseracing.backend.service.HorseService;
import com.horseracing.backend.service.InvitationService;
import com.horseracing.backend.service.JockeyOwnerDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Horse Owner Service", description = "Dịch vụ Chủ ngựa: Danh sách ngựa, Lời mời và Thống kê Dashboard")
public class HorseOwnerController {

    private final HorseService horseService;
    private final InvitationService invitationService;
    private final JockeyOwnerDashboardService dashboardService;

    @GetMapping("/{id}/horses")
    @Operation(summary = "Lấy danh sách ngựa của Chủ sở hữu")
    public ResponseEntity<List<HorseDTO>> getOwnerHorses(@PathVariable Integer id) {
        return ResponseEntity.ok(horseService.getAllHorses(null, id));
    }

    @GetMapping("/{id}/invitations")
    @Operation(summary = "Lấy danh sách lời mời thi đấu của Chủ ngựa")
    public ResponseEntity<List<RaceInvitationDTO>> getOwnerInvitations(@PathVariable Integer id) {
        return ResponseEntity.ok(invitationService.getInvitations(null, id));
    }

    @GetMapping("/{id}/dashboard")
    @Operation(summary = "Lấy dữ liệu Dashboard tổng quan của Chủ ngựa")
    public ResponseEntity<Map<String, Object>> getOwnerDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerDashboard(id));
    }

    @GetMapping("/{id}/stable")
    @Operation(summary = "Lấy danh sách chuồng ngựa của Chủ sở hữu")
    public ResponseEntity<List<Map<String, Object>>> getOwnerStable(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerStable(id));
    }

    @GetMapping("/{id}/results")
    @Operation(summary = "Lấy lịch sử kết quả thi đấu của các con ngựa thuộc Chủ sở hữu")
    public ResponseEntity<List<Map<String, Object>>> getOwnerResults(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerResults(id));
    }
}
