package com.horseracing.backend.controller;

import com.horseracing.backend.dto.RaceInvitationDTO;
import com.horseracing.backend.service.InvitationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Invitation Service", description = "Quản lý lời mời thi đấu giữa Chủ ngựa và Nài ngựa")
public class InvitationController {

    private final InvitationService invitationService;

    @GetMapping
    @Operation(summary = "Lấy danh sách lời mời thi đấu", description = "📌 **Code Handler**: `InvitationController.getInvitations()` -> `InvitationService.getInvitations()`")
    public ResponseEntity<List<RaceInvitationDTO>> getInvitations(@RequestParam(required = false) Integer jockeyId,
                                                                  @RequestParam(required = false) Integer ownerId) {
        return ResponseEntity.ok(invitationService.getInvitations(jockeyId, ownerId));
    }

    @PostMapping
    @Operation(summary = "Tạo lời mời Nài ngựa thi đấu (Chủ ngựa)", description = "📌 **Code Handler**: `InvitationController.inviteJockey()` -> `InvitationService.inviteJockey()`")
    public ResponseEntity<?> inviteJockey(@RequestBody RaceInvitationDTO inviteDTO) {
        try {
            RaceInvitationDTO saved = invitationService.inviteJockey(inviteDTO);
            return ResponseEntity.ok(Map.of("success", true, "invitation", saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Chấp nhận lời mời thi đấu (Nài ngựa)", description = "📌 **Code Handler**: `InvitationController.acceptInvitation()` -> `InvitationService.acceptInvitation()`")
    public ResponseEntity<?> acceptInvitation(@PathVariable Integer id) {
        try {
            invitationService.acceptInvitation(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation accepted and entry submitted."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Từ chối lời mời thi đấu (Nài ngựa)", description = "📌 **Code Handler**: `InvitationController.rejectInvitation()` -> `InvitationService.rejectInvitation()`")
    public ResponseEntity<?> rejectInvitation(@PathVariable Integer id) {
        try {
            invitationService.rejectInvitation(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation rejected successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/resubmit")
    @Operation(summary = "Nộp lại đơn tham gia thi đấu", description = "📌 **Code Handler**: `InvitationController.resubmitRaceEntry()` -> `InvitationService.resubmitRaceEntry()`")
    public ResponseEntity<?> resubmitRaceEntry(@PathVariable Integer entryId) {
        try {
            invitationService.resubmitRaceEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Entry resubmitted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/withdraw")
    @Operation(summary = "Rút lại lời mời thi đấu (Chủ ngựa)", description = "📌 **Code Handler**: `InvitationController.withdrawInvitation()` -> `InvitationService.withdrawInvitation()`")
    public ResponseEntity<?> withdrawInvitation(@PathVariable Integer id, @RequestParam Integer ownerId) {
        try {
            invitationService.withdrawInvitation(id, ownerId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation withdrawn successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
