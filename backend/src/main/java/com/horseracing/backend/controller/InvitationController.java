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
                  "* **Services**: `InvitationService.java`\n" +
                  "* **Repositories**: `RaceInvitationRepository.java`, `RaceEntryRepository.java`\n" +
                  "* **Entities**: `RaceInvitation.java`, `RaceEntry.java`\n" +
                  "* **DTOs**: `RaceInvitationDTO.java`\n" +
                  "* **Frontend**: `HorseOwner.tsx` (dashboards), `Jockey.tsx` (dashboards), `horseOwnerService.ts`, `jockeyService.ts`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Chủ ngựa gửi lời mời Nài ngựa thi đấu (`inviteJockey`).\n" +
                  "2. Nài ngựa Chấp nhận (`acceptInvitation`) hoặc Từ chối (`rejectInvitation`).\n" +
                  "3. Nếu chấp nhận: Hệ thống tự động tạo bản ghi `RaceEntry` cho trận đua."
)
public class InvitationController {

    private final InvitationService invitationService;

    @GetMapping
    @Operation(
        summary = "GET: Lấy danh sách lời mời thi đấu",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền jockeyId hoặc ownerId -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.getInvitations()`\n" +
                      "* **Service**: `InvitationService.getInvitations()`\n" +
                      "* **Repository**: `RaceInvitationRepository.findByJockeyId()` / `findByOwnerId()`\n" +
                      "* **Entity**: `RaceInvitation.java`\n" +
                      "* **DTO Response**: `List<RaceInvitationDTO>`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tiếp nhận tham số lọc theo `jockeyId` hoặc `ownerId`.\n" +
                      "2. Truy vấn danh sách lời mời thi đấu trong cơ sở dữ liệu.\n" +
                      "3. Trả về danh sách `RaceInvitationDTO` đã được lọc."
    )
    public ResponseEntity<List<RaceInvitationDTO>> getInvitations(@RequestParam(required = false) Integer jockeyId,
                                                                  @RequestParam(required = false) Integer ownerId) {
        return ResponseEntity.ok(invitationService.getInvitations(jockeyId, ownerId));
    }

    @PostMapping
    @Operation(
        summary = "POST: Tạo lời mời Nài ngựa thi đấu (Chủ ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.inviteJockey()`\n" +
                      "* **Service**: `InvitationService.inviteJockey()`\n" +
                      "* **Repository**: `RaceInvitationRepository.save()`\n" +
                      "* **Entity**: `RaceInvitation.java`\n" +
                      "* **DTO Request**: `RaceInvitationDTO` (`raceId`, `horseId`, `jockeyId`, `ownerId`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"invitation\": RaceInvitationDTO}`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Chủ ngựa chọn Nài ngựa và Chiến mã muốn mời vào trận đua.\n" +
                      "2. Kiểm tra xem Nài ngựa và Ngựa đã đăng ký Ngày đua chưa.\n" +
                      "3. Tạo bản ghi `RaceInvitation` với trạng thái `PENDING` chờ Nài ngựa phản hồi.\n" +
                      "4. Trả về thông tin lời mời vừa tạo."
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
        summary = "POST: Chấp nhận lời mời thi đấu (Nài ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.acceptInvitation()`\n" +
                      "* **Service**: `InvitationService.acceptInvitation()`\n" +
                      "* **Repositories**: `RaceInvitationRepository.save()`, `RaceEntryRepository.save()`\n" +
                      "* **Entities**: `RaceInvitation.java`, `RaceEntry.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Nài ngựa xác nhận chấp nhận lời mời theo `invitationId`.\n" +
                      "2. Cập nhật trạng thái `RaceInvitation` sang `ACCEPTED`.\n" +
                      "3. Tự động tạo bản ghi `RaceEntry` (Phiếu tham gia trận đua) với trạng thái `PENDING`.\n" +
                      "4. Trả về kết quả xác nhận thành công."
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
        summary = "POST: Từ chối lời mời thi đấu (Nài ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.rejectInvitation()`\n" +
                      "* **Service**: `InvitationService.rejectInvitation()`\n" +
                      "* **Repository**: `RaceInvitationRepository.save()`\n" +
                      "* **Entity**: `RaceInvitation.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Nài ngựa từ chối lời mời theo `invitationId`.\n" +
                      "2. Cập nhật trạng thái `RaceInvitation` sang `REJECTED`.\n" +
                      "3. Trả về kết quả từ chối thành công."
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
        summary = "POST: Nộp lại đơn tham gia thi đấu",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.resubmitRaceEntry()`\n" +
                      "* **Service**: `InvitationService.resubmitRaceEntry()`\n" +
                      "* **Repository**: `RaceEntryRepository.save()`\n" +
                      "* **Entity**: `RaceEntry.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tìm bản ghi `RaceEntry` theo `entryId`.\n" +
                      "2. Đặt lại trạng thái từ `REJECTED` về `PENDING` để Admin có thể xét duyệt lại.\n" +
                      "3. Trả về kết quả nộp lại thành công."
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
        summary = "POST: Rút lại lời mời thi đấu (Chủ ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `InvitationController.withdrawInvitation()`\n" +
                      "* **Service**: `InvitationService.withdrawInvitation()`\n" +
                      "* **Repository**: `RaceInvitationRepository.save()`\n" +
                      "* **Entity**: `RaceInvitation.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra quyền sở hữu lời mời thuộc về Chủ ngựa (theo `ownerId`).\n" +
                      "2. Cập nhật trạng thái `RaceInvitation` sang `WITHDRAWN`.\n" +
                      "3. Trả về kết quả rút lời mời thành công."
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
