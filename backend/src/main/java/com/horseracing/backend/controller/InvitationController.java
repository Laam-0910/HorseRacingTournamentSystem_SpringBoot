package com.horseracing.backend.controller;

import com.horseracing.backend.dto.RaceInvitationDTO;
import com.horseracing.backend.service.InvitationService;
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
public class InvitationController {

    private final InvitationService invitationService; // Dịch vụ quản lý lời mời thi đấu

    // Lấy danh sách lời mời thi đấu có bộ lọc theo kỵ sĩ hoặc chủ ngựa
    @GetMapping // Xử lý HTTP GET request gửi tới /api/invitations
        public ResponseEntity<List<RaceInvitationDTO>> getInvitations(@RequestParam(required = false) Integer jockeyId,
                                                                  @RequestParam(required = false) Integer ownerId) {
        // Gọi dịch vụ invitationService để lấy danh sách lời mời thi đấu theo jockeyId hoặc ownerId và trả về HTTP 200 OK
        return ResponseEntity.ok(invitationService.getInvitations(jockeyId, ownerId));
    }

    // Gửi lời mời thi đấu mới (Chủ ngựa mời kỵ sĩ cưỡi chiến mã của mình)
    @PostMapping // Xử lý HTTP POST request gửi tới /api/invitations
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
