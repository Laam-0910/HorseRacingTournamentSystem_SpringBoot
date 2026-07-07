package com.horseracing.backend.controller;

import com.horseracing.backend.dto.RaceInvitationDTO;
import com.horseracing.backend.service.InvitationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/invitations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class InvitationController {

    private final InvitationService invitationService;

    @GetMapping
    public ResponseEntity<List<RaceInvitationDTO>> getInvitations(@RequestParam(required = false) Integer jockeyId,
                                                                  @RequestParam(required = false) Integer ownerId) {
        return ResponseEntity.ok(invitationService.getInvitations(jockeyId, ownerId));
    }

    @PostMapping
    public ResponseEntity<?> inviteJockey(@RequestBody RaceInvitationDTO inviteDTO) {
        try {
            RaceInvitationDTO saved = invitationService.inviteJockey(inviteDTO);
            return ResponseEntity.ok(Map.of("success", true, "invitation", saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptInvitation(@PathVariable Integer id) {
        try {
            invitationService.acceptInvitation(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation accepted and entry submitted."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<?> rejectInvitation(@PathVariable Integer id) {
        try {
            invitationService.rejectInvitation(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation rejected successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/resubmit")
    public ResponseEntity<?> resubmitRaceEntry(@PathVariable Integer entryId) {
        try {
            invitationService.resubmitRaceEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Entry resubmitted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/withdraw")
    public ResponseEntity<?> withdrawInvitation(@PathVariable Integer id, @RequestParam Integer ownerId) {
        try {
            invitationService.withdrawInvitation(id, ownerId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation withdrawn successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
