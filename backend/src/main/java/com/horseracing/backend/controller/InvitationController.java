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
@Tag(
    name = "08. Invitation & Jockey Service",
    description = "✉️ **BƯỚC 8: LỜI MỜI THI ĐẤU GIỮA CHỦ NGỰA VÀ NÀI NGỰA (INVITATION ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `InvitationController.java`, `JockeyController.java`\n" +
                  "* **Services**: `InvitationService.java` (`InvitationServiceImpl.java`)\n" +
                  "* **Repositories**: `RaceInvitationRepository.java`, `RaceEntryRepository.java`\n" +
                  "* **Entities**: `RaceInvitation.java`, `RaceEntry.java`\n" +
                  "* **DTOs**: `RaceInvitationDTO.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Chủ ngựa gửi lời mời Nài ngựa thi đấu (`inviteJockey`).\n" +
                  "2. Nài ngựa Chấp nhận (`acceptInvitation`) hoặc Từ chối (`rejectInvitation`).\n" +
                  "3. Nếu chấp nhận: Hệ thống tự động tạo bản ghi `RaceEntry` cho trận đua."
)
public class InvitationController {

    private final InvitationService invitationService;

    @GetMapping
    @Operation(summary = "GET: Lấy danh sách lời mời thi đấu", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền jockeyId hoặc ownerId -> 'Execute'.\n\n📌 **Code Architecture**: `InvitationController.getInvitations()` -> `InvitationService.getInvitations()`")
    public ResponseEntity<List<RaceInvitationDTO>> getInvitations(@RequestParam(required = false) Integer jockeyId,
                                                                  @RequestParam(required = false) Integer ownerId) {
        return ResponseEntity.ok(invitationService.getInvitations(jockeyId, ownerId));
    }

    @PostMapping
    @Operation(summary = "POST: Tạo lời mời Nài ngựa thi đấu (Chủ ngựa)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `InvitationController.inviteJockey()` -> `InvitationService.inviteJockey()`")
    public ResponseEntity<?> inviteJockey(@RequestBody RaceInvitationDTO inviteDTO) {
        try {
            RaceInvitationDTO saved = invitationService.inviteJockey(inviteDTO);
            return ResponseEntity.ok(Map.of("success", true, "invitation", saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "POST: Chấp nhận lời mời thi đấu (Nài ngựa)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `InvitationController.acceptInvitation()` -> `InvitationService.acceptInvitation()` -> Tự động tạo RaceEntry")
    public ResponseEntity<?> acceptInvitation(@PathVariable Integer id) {
        try {
            invitationService.acceptInvitation(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation accepted and entry submitted."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "POST: Từ chối lời mời thi đấu (Nài ngựa)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `InvitationController.rejectInvitation()` -> `InvitationService.rejectInvitation()`")
    public ResponseEntity<?> rejectInvitation(@PathVariable Integer id) {
        try {
            invitationService.rejectInvitation(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation rejected successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/resubmit")
    @Operation(summary = "POST: Nộp lại đơn tham gia thi đấu", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `InvitationController.resubmitRaceEntry()` -> `InvitationService.resubmitRaceEntry()`")
    public ResponseEntity<?> resubmitRaceEntry(@PathVariable Integer entryId) {
        try {
            invitationService.resubmitRaceEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Entry resubmitted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/withdraw")
    @Operation(summary = "POST: Rút lại lời mời thi đấu (Chủ ngựa)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `InvitationController.withdrawInvitation()` -> `InvitationService.withdrawInvitation()`")
    public ResponseEntity<?> withdrawInvitation(@PathVariable Integer id, @RequestParam Integer ownerId) {
        try {
            invitationService.withdrawInvitation(id, ownerId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation withdrawn successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
