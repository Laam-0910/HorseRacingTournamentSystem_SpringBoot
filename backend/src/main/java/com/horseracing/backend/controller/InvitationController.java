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

/**
 * Controller InvitationController - Lớp kiểm soát các endpoint liên quan đến Lời mời thi đấu giữa Chủ ngựa và Nài ngựa.
 * - Lấy danh sách toàn bộ lời mời, lọc theo jockeyId hoặc ownerId.
 * - Chủ ngựa gửi lời mời Nài ngựa cùng chiến mã cụ thể tham gia giải đấu (inviteJockey).
 * - Nài ngựa Chấp nhận (Accept) lời mời, hệ thống tự động tạo bản ghi tham gia lượt đua (RaceEntry).
 * - Nài ngựa Từ chối (Reject) lời mời.
 * - Nộp lại hồ sơ tham gia lượt đua (resubmitRaceEntry) sau khi chỉnh sửa nếu bị từ chối trước đó.
 * - Chủ ngựa rút lại lời mời thi đấu đã gửi (withdrawInvitation).
 */
@RestController // Đánh dấu lớp này là một Spring REST Controller để xử lý các HTTP request
@RequestMapping("/api/invitations") // Định nghĩa đường dẫn tiền tố cho tất cả các endpoint trong controller này
@RequiredArgsConstructor // Tự động tạo constructor injection cho các trường final
@CrossOrigin(origins = "*") // Hỗ trợ CORS cho phép truy cập từ mọi nguồn
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

    private final InvitationService invitationService; // Dịch vụ quản lý lời mời thi đấu

    // Lấy danh sách lời mời thi đấu có bộ lọc theo kỵ sĩ hoặc chủ ngựa
    @GetMapping // Xử lý HTTP GET request gửi tới /api/invitations
    @Operation(
        summary = "GET: Lấy danh sách lời mời thi đấu",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `InvitationController.getInvitations()`\n" +
                      "* **Services**: `InvitationService.getInvitations()`\n" +
                      "* **Repositories**: `RaceInvitationRepository.findByJockeyId()` / `findByOwnerId()`\n" +
                      "* **Entities**: `RaceInvitation.java`\n" +
                      "* **DTOs**: `RaceInvitationDTO`\n" +
                      "* **DTO Response**: `List<RaceInvitationDTO>`\n" +
                      "* **Frontend**: `HorseOwner.tsx` (dashboards), `Jockey.tsx` (dashboards), `invitationService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tiếp nhận tham số lọc theo `jockeyId` hoặc `ownerId`.\n" +
                      "2. Truy vấn danh sách lời mời thi đấu trong cơ sở dữ liệu.\n" +
                      "3. Trả về danh sách `RaceInvitationDTO` đã được lọc."
    )
    public ResponseEntity<List<RaceInvitationDTO>> getInvitations(@RequestParam(required = false) Integer jockeyId,
                                                                  @RequestParam(required = false) Integer ownerId) {
        // Gọi dịch vụ invitationService để lấy danh sách lời mời thi đấu theo jockeyId hoặc ownerId và trả về HTTP 200 OK
        return ResponseEntity.ok(invitationService.getInvitations(jockeyId, ownerId));
    }

    // Gửi lời mời thi đấu mới (Chủ ngựa mời kỵ sĩ cưỡi chiến mã của mình)
    @PostMapping // Xử lý HTTP POST request gửi tới /api/invitations
    @Operation(
        summary = "POST: Tạo lời mời Nài ngựa thi đấu (Chủ ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `InvitationController.inviteJockey()`\n" +
                      "* **Services**: `InvitationService.inviteJockey()`\n" +
                      "* **Repositories**: `RaceInvitationRepository.save()`\n" +
                      "* **Entities**: `RaceInvitation.java`\n" +
                      "* **DTOs**: `RaceInvitationDTO` (`raceId`, `horseId`, `jockeyId`, `ownerId`), `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Request**: `RaceInvitationDTO` (`raceId`, `horseId`, `jockeyId`, `ownerId`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"invitation\": RaceInvitationDTO}`)\n" +
                      "* **Frontend**: `HorseOwner.tsx` (dashboards), `invitationService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Chủ ngựa chọn Nài ngựa và Chiến mã muốn mời vào trận đua.\n" +
                      "2. Kiểm tra xem Nài ngựa và Ngựa đã đăng ký Ngày đua chưa.\n" +
                      "3. Tạo bản ghi `RaceInvitation` với trạng thái `PENDING` chờ Nài ngựa phản hồi.\n" +
                      "4. Trả về thông tin lời mời vừa tạo."
    )
    public ResponseEntity<?> inviteJockey(@RequestBody RaceInvitationDTO inviteDTO) {
        try {
            // Gọi tầng nghiệp vụ để thực hiện gửi lời mời thi đấu đến kỵ sĩ
            RaceInvitationDTO saved = invitationService.inviteJockey(inviteDTO);
            // Trả về kết quả thành công kèm thông tin bản ghi lời mời đã lưu
            return ResponseEntity.ok(Map.of("success", true, "invitation", saved));
        } catch (IllegalArgumentException e) {
            // Xử lý ngoại lệ nếu dữ liệu không hợp lệ và trả về mã lỗi 400 Bad Request
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Kỵ sĩ Chấp nhận lời mời thi đấu
    @PostMapping("/{id}/accept") // Xử lý HTTP POST request gửi tới /api/invitations/{id}/accept
    @Operation(
        summary = "POST: Chấp nhận lời mời thi đấu (Nài ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `InvitationController.acceptInvitation()`\n" +
                      "* **Services**: `InvitationService.acceptInvitation()`\n" +
                      "* **Repositories**: `RaceInvitationRepository.save()`, `RaceEntryRepository.save()`\n" +
                      "* **Entities**: `RaceInvitation.java`, `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `Jockey.tsx` (dashboards), `invitationService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Nài ngựa xác nhận chấp nhận lời mời theo `invitationId`.\n" +
                      "2. Cập nhật trạng thái `RaceInvitation` sang `ACCEPTED`.\n" +
                      "3. Tự động tạo bản ghi `RaceEntry` (Phiếu tham gia trận đua) với trạng thái `PENDING`.\n" +
                      "4. Trả về kết quả xác nhận thành công."
    )
    public ResponseEntity<?> acceptInvitation(@PathVariable Integer id) {
        try {
            // Gọi dịch vụ xử lý chấp nhận lời mời và khởi tạo đơn tham gia lượt đua
            invitationService.acceptInvitation(id);
            // Trả về thông báo chấp nhận lời mời thành công
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation accepted and entry submitted."));
        } catch (IllegalArgumentException e) {
            // Xử lý khi có lỗi nghiệp vụ xảy ra và trả về phản hồi lỗi Bad Request
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Kỵ sĩ từ chối lời mời thi đấu
    @PostMapping("/{id}/reject") // Xử lý HTTP POST request gửi tới /api/invitations/{id}/reject
    @Operation(
        summary = "POST: Từ chối lời mời thi đấu (Nài ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `InvitationController.rejectInvitation()`\n" +
                      "* **Services**: `InvitationService.rejectInvitation()`\n" +
                      "* **Repositories**: `RaceInvitationRepository.save()`\n" +
                      "* **Entities**: `RaceInvitation.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `Jockey.tsx` (dashboards), `invitationService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Nài ngựa từ chối lời mời theo `invitationId`.\n" +
                      "2. Cập nhật trạng thái `RaceInvitation` sang `REJECTED`.\n" +
                      "3. Trả về kết quả từ chối thành công."
    )
    public ResponseEntity<?> rejectInvitation(@PathVariable Integer id) {
        try {
            // Gọi tầng nghiệp vụ để cập nhật trạng thái từ chối lời mời
            invitationService.rejectInvitation(id);
            // Trả về phản hồi thành công thông báo đã từ chối lời mời
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation rejected successfully."));
        } catch (IllegalArgumentException e) {
            // Trả về lỗi 400 Bad Request kèm theo nội dung ngoại lệ nếu không tìm thấy lời mời
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Gửi lại hồ sơ lượt chạy (đổi trạng thái từ REJECTED về PENDING để xem xét lại)
    @PostMapping("/entry/{entryId}/resubmit") // Xử lý HTTP POST request gửi tới /api/invitations/entry/{entryId}/resubmit
    @Operation(
        summary = "POST: Nộp lại đơn tham gia thi đấu",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `InvitationController.resubmitRaceEntry()`\n" +
                      "* **Services**: `InvitationService.resubmitRaceEntry()`\n" +
                      "* **Repositories**: `RaceEntryRepository.save()`\n" +
                      "* **Entities**: `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx`, `invitationService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tìm bản ghi `RaceEntry` theo `entryId`.\n" +
                      "2. Đặt lại trạng thái từ `REJECTED` về `PENDING` để Admin có thể xét duyệt lại.\n" +
                      "3. Trả về kết quả nộp lại thành công."
    )
    public ResponseEntity<?> resubmitRaceEntry(@PathVariable Integer entryId) {
        try {
            // Gọi dịch vụ để nộp lại đơn đăng ký tham gia thi đấu bị từ chối
            invitationService.resubmitRaceEntry(entryId);
            // Trả về kết quả thông báo nộp lại đơn thành công
            return ResponseEntity.ok(Map.of("success", true, "message", "Entry resubmitted successfully."));
        } catch (IllegalArgumentException e) {
            // Trả về thông báo lỗi nếu quá trình nộp lại gặp sự cố
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Rút lại lời mời thi đấu đã gửi (Chủ ngựa thực hiện)
    @PostMapping("/{id}/withdraw") // Xử lý HTTP POST request gửi tới /api/invitations/{id}/withdraw
    @Operation(
        summary = "POST: Rút lại lời mời thi đấu (Chủ ngựa)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `InvitationController.withdrawInvitation()`\n" +
                      "* **Services**: `InvitationService.withdrawInvitation()`\n" +
                      "* **Repositories**: `RaceInvitationRepository.save()`\n" +
                      "* **Entities**: `RaceInvitation.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `HorseOwner.tsx` (dashboards), `invitationService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra quyền sở hữu lời mời thuộc về Chủ ngựa (theo `ownerId`).\n" +
                      "2. Cập nhật trạng thái `RaceInvitation` sang `WITHDRAWN`.\n" +
                      "3. Trả về kết quả rút lời mời thành công."
    )
    public ResponseEntity<?> withdrawInvitation(@PathVariable Integer id, @RequestParam Integer ownerId) {
        try {
            // Gọi tầng nghiệp vụ để rút lại lời mời thi đấu theo ID lời mời và ID chủ ngựa
            invitationService.withdrawInvitation(id, ownerId);
            // Trả về thông báo rút lời mời thi đấu thành công
            return ResponseEntity.ok(Map.of("success", true, "message", "Invitation withdrawn successfully."));
        } catch (Exception e) {
            // Phản hồi mã lỗi Bad Request nếu thao tác rút lời mời không hợp lệ
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
