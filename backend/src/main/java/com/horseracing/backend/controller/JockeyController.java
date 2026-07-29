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

/**
 * Controller JockeyController - Lớp kiểm soát các endpoint dành riêng cho kỵ sĩ/nài ngựa (Jockey).
 * - Xem danh sách lời mời cưỡi ngựa từ chủ ngựa.
 * - Xem thống kê hiệu suất cá nhân trên Dashboard (tỷ lệ thắng, số lượt đua...).
 * - Xem danh sách các lượt cưỡi thi đấu thực tế.
 * - Xem và ký xác nhận các biên bản vi phạm luật do trọng tài lập.
 */
@RestController
@RequestMapping("/api/jockey")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
@Tag(
    name = "08. Invitation & Jockey Service",
    description = "🤠 **DỊCH VỤ DÀNH CHO NÀI NGỰA (JOCKEY ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `JockeyController.java`, `InvitationController.java`\n" +
                  "* **Services**: `JockeyOwnerDashboardService.java`, `InvitationService.java`, `RefereeService.java`\n" +
                  "* **Repositories**: `RaceInvitationRepository.java`, `RaceEntryRepository.java`, `ViolationRepository.java`\n" +
                  "* **Entities**: `User.java` (roleId = 3), `RaceInvitation.java`, `Violation.java`\n" +
                  "* **Frontend**: `Jockey.tsx` (dashboards), `jockeyService.ts`"
)
public class JockeyController {

    private final InvitationService invitationService; // Dịch vụ quản lý lời mời
    private final JockeyOwnerDashboardService dashboardService; // Dịch vụ tổng hợp dữ liệu Dashboard
    private final RefereeService refereeService; // Dịch vụ trọng tài (quản lý vi phạm)

    // Lấy danh sách toàn bộ lời mời cưỡi ngựa của kỵ sĩ hiện tại theo ID tài khoản
    @GetMapping("/{id}/invitations")
    @Operation(
        summary = "GET: Lấy danh sách lời mời thi đấu của Nài ngựa",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền id Nài ngựa -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `JockeyController.getJockeyInvitations()`\n" +
                      "* **Service**: `InvitationService.getInvitations()`\n" +
                      "* **Repository**: `RaceInvitationRepository.findByJockeyId()`\n" +
                      "* **Entity**: `RaceInvitation.java`\n" +
                      "* **DTO Response**: `List<RaceInvitationDTO>`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tiếp nhận ID Nài ngựa từ PathVariable.\n" +
                      "2. Truy vấn danh sách tất cả lời mời thi đấu gửi đến Nài ngựa này."
    )
    public ResponseEntity<List<RaceInvitationDTO>> getJockeyInvitations(@PathVariable Integer id) {
        return ResponseEntity.ok(invitationService.getInvitations(id, null));
    }

    // Lấy thông tin thống kê hiệu suất thi đấu hiển thị trên Dashboard của kỵ sĩ
    @GetMapping("/{id}/dashboard")
    @Operation(
        summary = "GET: Lấy dữ liệu Dashboard cá nhân Nài ngựa",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền id Nài ngựa -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `JockeyController.getJockeyDashboard()`\n" +
                      "* **Service**: `JockeyOwnerDashboardService.getJockeyDashboard()`\n" +
                      "* **Repository**: `RaceEntryRepository.findByJockeyId()`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`totalRides`, `wins`, `top3`, `winRate`, `totalEarnings`)\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tổng hợp tổng số lượt thi đấu (`totalRides`), tổng chiến thắng (`wins`), top 3.\n" +
                      "2. Tính tỷ lệ thắng (`winRate`) và tổng tiền thưởng (`totalEarnings`) lũy kế."
    )
    public ResponseEntity<Map<String, Object>> getJockeyDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyDashboard(id));
    }

    // Lấy thông tin chi tiết về các trận đấu mà kỵ sĩ này được đăng ký tham gia (Mounts)
    @GetMapping("/{id}/mounts")
    @Operation(
        summary = "GET: Lấy danh sách các lượt cưỡi thi đấu của Nài ngựa",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền id Nài ngựa -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `JockeyController.getJockeyMounts()`\n" +
                      "* **Service**: `JockeyOwnerDashboardService.getJockeyMounts()`\n" +
                      "* **Repository**: `RaceEntryRepository.findByJockeyId()`\n" +
                      "* **DTO Response**: `List<Map<String, Object>>` (Chứa thông tin Horse, Race, Position)\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Lấy danh sách tất cả `RaceEntry` mà Nài ngựa này đã tham gia thi đấu.\n" +
                      "2. Gắn kèm thông tin chiến mã, trận đua và kết quả cán đích."
    )
    public ResponseEntity<List<Map<String, Object>>> getJockeyMounts(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyMounts(id));
    }

    // Lấy danh sách vi phạm của kỵ sĩ này do trọng tài ghi nhận trong quá trình thi đấu
    @GetMapping("/{id}/violations")
    @Operation(
        summary = "GET: Lấy danh sách lỗi vi phạm thi đấu của Nài ngựa",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền id Nài ngựa -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `JockeyController.getJockeyViolations()`\n" +
                      "* **Service**: `JockeyOwnerDashboardService.getJockeyViolations()`\n" +
                      "* **Repository**: `ViolationRepository.findByJockeyId()`\n" +
                      "* **Entity**: `Violation.java`\n" +
                      "* **DTO Response**: `List<Map<String, Object>>`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Truy vấn danh sách các vi phạm (`Violation`) do Trọng tài ghi nhận cho Nài ngựa này.\n" +
                      "2. Trả về danh sách vi phạm kèm theo trạng thái xác nhận."
    )
    public ResponseEntity<List<Map<String, Object>>> getJockeyViolations(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getJockeyViolations(id));
    }

    // Kỵ sĩ ký xác nhận (Acknowledge) đã nắm được biên bản vi phạm luật thi đấu
    @PostMapping("/violations/{violationId}/confirm")
    @Operation(
        summary = "POST: Xác nhận nhận biên bản vi phạm",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `JockeyController.confirmViolation()`\n" +
                      "* **Service**: `RefereeService.confirmViolation()`\n" +
                      "* **Repository**: `ViolationRepository.save()`\n" +
                      "* **Entity**: `Violation.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Nài ngựa xác nhận đã đọc và nhận biên bản vi phạm theo `violationId`.\n" +
                      "2. Cập nhật trạng thái `Violation.jockeyAcknowledged = true`.\n" +
                      "3. Trả về kết quả xác nhận thành công."
    )
    public ResponseEntity<?> confirmViolation(@PathVariable Integer violationId) {
        try {
            // Xác nhận biên bản vi phạm ở tầng nghiệp vụ trọng tài
            refereeService.confirmViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation acknowledged successfully"));
        } catch (Exception e) {
            // Phản hồi lỗi nếu vi phạm không tồn tại hoặc lỗi SQL
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
