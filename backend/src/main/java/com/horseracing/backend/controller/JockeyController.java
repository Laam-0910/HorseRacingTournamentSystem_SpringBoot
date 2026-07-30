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
@RestController // Đánh dấu lớp này là một Spring REST Controller để nhận và xử lý HTTP Request
@RequestMapping("/api/jockey") // Thiết lập tiền tố URL cho các API trong controller này
@RequiredArgsConstructor // Khởi tạo constructor tự động cho các biến final (Dependency Injection)
@CrossOrigin(origins = "*") // Hỗ trợ CORS cho phép truy cập từ mọi địa chỉ frontend
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

    private final InvitationService invitationService; // Dịch vụ quản lý lời mời thi đấu
    private final JockeyOwnerDashboardService dashboardService; // Dịch vụ tổng hợp dữ liệu Dashboard cho nài ngựa và chủ ngựa
    private final RefereeService refereeService; // Dịch vụ trọng tài (quản lý xử lý vi phạm)

    // Lấy danh sách toàn bộ lời mời cưỡi ngựa của kỵ sĩ hiện tại theo ID tài khoản
    @GetMapping("/{id}/invitations") // Tiếp nhận HTTP GET request gửi tới /api/jockey/{id}/invitations
    @Operation(
        summary = "GET: Lấy danh sách lời mời thi đấu của Nài ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `JockeyController.getJockeyInvitations()`\n" +
                      "* **Services**: `InvitationService.getInvitations()`\n" +
                      "* **Repositories**: `RaceInvitationRepository.findByJockeyId()`\n" +
                      "* **Entities**: `RaceInvitation.java`\n" +
                      "* **DTOs**: `RaceInvitationDTO`\n" +
                      "* **DTO Response**: `List<RaceInvitationDTO>`\n" +
                      "* **Frontend**: `Jockey.tsx` (dashboards), `jockeyService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tiếp nhận ID Nài ngựa từ PathVariable.\n" +
                      "2. Truy vấn danh sách tất cả lời mời thi đấu gửi đến Nài ngựa này."
    )
    public ResponseEntity<List<RaceInvitationDTO>> getJockeyInvitations(@PathVariable Integer id) {
        // Truy vấn dịch vụ lời mời theo ID kỵ sĩ và trả về mã HTTP 200 OK cùng danh sách DTO
        return ResponseEntity.ok(invitationService.getInvitations(id, null));
    }

    // Lấy thông tin thống kê hiệu suất thi đấu hiển thị trên Dashboard của kỵ sĩ
    @GetMapping("/{id}/dashboard") // Tiếp nhận HTTP GET request gửi tới /api/jockey/{id}/dashboard
    @Operation(
        summary = "GET: Lấy dữ liệu Dashboard cá nhân Nài ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `JockeyController.getJockeyDashboard()`\n" +
                      "* **Services**: `JockeyOwnerDashboardService.getJockeyDashboard()`\n" +
                      "* **Repositories**: `RaceEntryRepository.findByJockeyId()`\n" +
                      "* **Entities**: `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`totalRides`, `wins`, `top3`, `winRate`, `totalEarnings`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`totalRides`, `wins`, `top3`, `winRate`, `totalEarnings`)\n" +
                      "* **Frontend**: `Jockey.tsx` (dashboards), `jockeyService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tổng hợp tổng số lượt thi đấu (`totalRides`), tổng chiến thắng (`wins`), top 3.\n" +
                      "2. Tính tỷ lệ thắng (`winRate`) và tổng tiền thưởng (`totalEarnings`) lũy kế."
    )
    public ResponseEntity<Map<String, Object>> getJockeyDashboard(@PathVariable Integer id) {
        // Gọi dịch vụ dashboardService để lấy dữ liệu thống kê tổng quan của kỵ sĩ
        return ResponseEntity.ok(dashboardService.getJockeyDashboard(id));
    }

    // Lấy thông tin chi tiết về các trận đấu mà kỵ sĩ này được đăng ký tham gia (Mounts)
    @GetMapping("/{id}/mounts") // Tiếp nhận HTTP GET request gửi tới /api/jockey/{id}/mounts
    @Operation(
        summary = "GET: Lấy danh sách các lượt cưỡi thi đấu của Nài ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `JockeyController.getJockeyMounts()`\n" +
                      "* **Services**: `JockeyOwnerDashboardService.getJockeyMounts()`\n" +
                      "* **Repositories**: `RaceEntryRepository.findByJockeyId()`\n" +
                      "* **Entities**: `RaceEntry.java`, `Horse.java`\n" +
                      "* **DTOs**: `List<Map<String, Object>>` (Chứa thông tin Horse, Race, Position)\n" +
                      "* **DTO Response**: `List<Map<String, Object>>` (`entryId`, `raceName`, `horseName`, `position`)\n" +
                      "* **Frontend**: `Jockey.tsx` (dashboards), `jockeyService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Lấy danh sách tất cả `RaceEntry` mà Nài ngựa này đã tham gia thi đấu.\n" +
                      "2. Gắn kèm thông tin chiến mã, trận đua và kết quả cán đích."
    )
    public ResponseEntity<List<Map<String, Object>>> getJockeyMounts(@PathVariable Integer id) {
        // Lấy danh sách lượt cưỡi thi đấu của kỵ sĩ từ dịch vụ và trả về client
        return ResponseEntity.ok(dashboardService.getJockeyMounts(id));
    }

    // Lấy danh sách vi phạm của kỵ sĩ này do trọng tài ghi nhận trong quá trình thi đấu
    @GetMapping("/{id}/violations") // Tiếp nhận HTTP GET request gửi tới /api/jockey/{id}/violations
    @Operation(
        summary = "GET: Lấy danh sách lỗi vi phạm thi đấu của Nài ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `JockeyController.getJockeyViolations()`\n" +
                      "* **Services**: `JockeyOwnerDashboardService.getJockeyViolations()`\n" +
                      "* **Repositories**: `ViolationRepository.findByJockeyId()`\n" +
                      "* **Entities**: `Violation.java`\n" +
                      "* **DTOs**: `List<Map<String, Object>>`\n" +
                      "* **DTO Response**: `List<Map<String, Object>>` (`violationId`, `raceId`, `reason`, `acknowledged`)\n" +
                      "* **Frontend**: `Jockey.tsx` (dashboards), `jockeyService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Truy vấn danh sách các vi phạm (`Violation`) do Trọng tài ghi nhận cho Nài ngựa này.\n" +
                      "2. Trả về danh sách vi phạm kèm theo trạng thái xác nhận."
    )
    public ResponseEntity<List<Map<String, Object>>> getJockeyViolations(@PathVariable Integer id) {
        // Truy vấn danh sách các vi phạm liên quan đến ID nài ngựa và trả về kết quả
        return ResponseEntity.ok(dashboardService.getJockeyViolations(id));
    }

    // Kỵ sĩ ký xác nhận (Acknowledge) đã nắm được biên bản vi phạm luật thi đấu
    @PostMapping("/violations/{violationId}/confirm") // Tiếp nhận HTTP POST request gửi tới /api/jockey/violations/{violationId}/confirm
    @Operation(
        summary = "POST: Xác nhận nhận biên bản vi phạm",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `JockeyController.confirmViolation()`\n" +
                      "* **Services**: `RefereeService.confirmViolation()`\n" +
                      "* **Repositories**: `ViolationRepository.save()`\n" +
                      "* **Entities**: `Violation.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `Jockey.tsx` (dashboards), `jockeyService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Nài ngựa xác nhận đã đọc và nhận biên bản vi phạm theo `violationId`.\n" +
                      "2. Cập nhật trạng thái `Violation.jockeyAcknowledged = true`.\n" +
                      "3. Trả về kết quả xác nhận thành công."
    )
    public ResponseEntity<?> confirmViolation(@PathVariable Integer violationId) {
        try {
            // Xác nhận biên bản vi phạm ở tầng nghiệp vụ trọng tài
            refereeService.confirmViolation(violationId);
            // Trả về phản hồi thành công xác nhận đã nhận biên bản vi phạm
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation acknowledged successfully"));
        } catch (Exception e) {
            // Phản hồi lỗi nếu vi phạm không tồn tại hoặc gặp lỗi xử lý
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
