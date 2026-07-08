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

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class HorseOwnerController {

    private final HorseService horseService;
    private final InvitationService invitationService;
    private final JockeyOwnerDashboardService dashboardService;

    @GetMapping("/{id}/horses")
    public ResponseEntity<List<HorseDTO>> getOwnerHorses(@PathVariable Integer id) {
        return ResponseEntity.ok(horseService.getAllHorses(null, id));
    }

    @GetMapping("/{id}/invitations")
    public ResponseEntity<List<RaceInvitationDTO>> getOwnerInvitations(@PathVariable Integer id) {
        return ResponseEntity.ok(invitationService.getInvitations(null, id));
    }

    @GetMapping("/{id}/dashboard")
    public ResponseEntity<Map<String, Object>> getOwnerDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerDashboard(id));
    }

    @GetMapping("/{id}/stable")
    public ResponseEntity<List<Map<String, Object>>> getOwnerStable(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerStable(id));
    }

    @GetMapping("/{id}/results")
    public ResponseEntity<List<Map<String, Object>>> getOwnerResults(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerResults(id));
    }
}
