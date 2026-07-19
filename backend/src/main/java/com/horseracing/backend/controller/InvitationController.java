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
    name = "Invitation Service",
    description = "✉️ **Cấu trúc Mô-đun Lời Mời Thi Đấu (Invitation Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `InvitationController.java`, `HorseOwnerController.java`, `JockeyController.java`\n" +
                  "* **Services**: `InvitationService.java` (`InvitationServiceImpl.java`)\n" +
                  "* **Repositories**: `RaceInvitationRepository.java`, `RaceEntryRepository.java`\n" +
                  "* **Entities**: `RaceInvitation.java`, `RaceEntry.java`\n" +
                  "* **DTOs**: `RaceInvitationDTO.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Chủ ngựa tạo Lời mời thi đấu gửi tới Nài ngựa (`inviteJockey`).\n" +
                  "2. Nài ngựa xem danh sách lời mời và chọn Chấp nhận (`ACCEPT`) hoặc Từ chối (`REJECT`).\n" +
                  "3. Nếu chấp nhận: Hệ thống tự động khởi tạo đơn `RaceEntry` tham gia trận đua."
)
public class InvitationController {

    private final InvitationService invitationService;

    @GetMapping
    @Operation(
        summary = "Lấy danh sách lời mời thi đấu",
        description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền jockeyId hoặc ownerId -> 'Execute' để xem danh sách lời mời.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.getInvitations()`\n" +
                      "* **Service**: `InvitationService.getInvitations()` (`InvitationServiceImpl.java`)\n" +
                      "* **Repository**: `RaceInvitationRepository.findByJockeyId/findByOwnerId()`\n" +
                      "* **DTO Response**: `List<RaceInvitationDTO>`"
    )
    public ResponseEntity<List<RaceInvitationDTO>> getInvitations(@RequestParam(required = false) Integer jockeyId,
                                                                  @RequestParam(required = false) Integer ownerId) {
        return ResponseEntity.ok(invitationService.getInvitations(jockeyId, ownerId));
    }

    @PostMapping
    @Operation(
        summary = "Tạo lời mời Nài ngựa thi đấu (Chủ ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.inviteJockey()`\n" +
                      "* **Service**: `InvitationService.inviteJockey()` (`InvitationServiceImpl.java`)\n" +
                      "* **Repository**: `RaceInvitationRepository.save()`\n" +
                      "* **Entity**: `RaceInvitation.java`\n" +
                      "* **DTO Request**: `RaceInvitationDTO` (`meetingId`, `horseId`, `jockeyId`, `ownerId`)\n" +
                      "* **DTO Response**: `RaceInvitationDTO`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Chủ ngựa gửi lời mời Nài ngựa cho Ngày đua cụ thể.\n" +
                      "2. Tạo lời mời ở trạng thái `PENDING` và thông báo tới Nài ngựa."
    )
    public ResponseEntity<?> inviteJockey(@RequestBody RaceInvitationDTO inviteDTO) {
        try {
            RaceInvitationDTO saved = invitationService.inviteJockey(inviteDTO);
            return ResponseEntity.ok(Map.of("success", true, "invitation", saved));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/accept")
    @Operation(
        summary = "Chấp nhận lời mời thi đấu (Nài ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.acceptInvitation()`\n" +
                      "* **Service**: `InvitationService.acceptInvitation()` (`InvitationServiceImpl.java`)\n" +
                      "* **Repositories**: `RaceInvitationRepository.save()`, `RaceEntryRepository.save()`\n" +
                      "* **Entities**: `RaceInvitation.java`, `RaceEntry.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Nài ngựa bấm Chấp nhận lời mời.\n" +
                      "2. Đổi trạng thái `RaceInvitation` sang `ACCEPTED`.\n" +
                      "3. Tự động tạo bản ghi `RaceEntry` cho Ngựa và Nài trong trận đua."
    )
    public ResponseEntity<?> acceptInvitation(@PathVariable Integer id) {
        try {
            invitationService.acceptInvitation(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation accepted and entry submitted."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/reject")
    @Operation(
        summary = "Từ chối lời mời thi đấu (Nài ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.rejectInvitation()`\n" +
                      "* **Service**: `InvitationService.rejectInvitation()` (`InvitationServiceImpl.java`)\n" +
                      "* **Repository**: `RaceInvitationRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Nài ngựa bấm Từ chối lời mời.\n" +
                      "2. Đổi trạng thái `RaceInvitation` sang `REJECTED`."
    )
    public ResponseEntity<?> rejectInvitation(@PathVariable Integer id) {
        try {
            invitationService.rejectInvitation(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation rejected successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/resubmit")
    @Operation(
        summary = "Nộp lại đơn tham gia thi đấu",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.resubmitRaceEntry()`\n" +
                      "* **Service**: `InvitationService.resubmitRaceEntry()` (`InvitationServiceImpl.java`)\n" +
                      "* **Repository**: `RaceEntryRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Chuyển trạng thái `RaceEntry` bị từ chối trở lại `PENDING` chờ duyệt."
    )
    public ResponseEntity<?> resubmitRaceEntry(@PathVariable Integer entryId) {
        try {
            invitationService.resubmitRaceEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Entry resubmitted successfully."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/withdraw")
    @Operation(
        summary = "Rút lại lời mời thi đấu (Chủ ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.withdrawInvitation()`\n" +
                      "* **Service**: `InvitationService.withdrawInvitation()` (`InvitationServiceImpl.java`)\n" +
                      "* **Repository**: `RaceInvitationRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Chủ ngựa chọn hủy/rút lại lời mời đã gửi trước đó."
    )
    public ResponseEntity<?> withdrawInvitation(@PathVariable Integer id, @RequestParam Integer ownerId) {
        try {
            invitationService.withdrawInvitation(id, ownerId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation withdrawn successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
