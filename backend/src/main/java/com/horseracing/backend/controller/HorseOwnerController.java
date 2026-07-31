package com.horseracing.backend.controller;

import com.horseracing.backend.dto.HorseDTO;
import com.horseracing.backend.dto.RaceInvitationDTO;
import com.horseracing.backend.service.HorseService;
import com.horseracing.backend.service.InvitationService;
import com.horseracing.backend.service.JockeyOwnerDashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller HorseOwnerController - Lớp kiểm soát các endpoint dành cho Chủ ngựa (Horse Owner).
 * - Xem danh mục các ngựa đang sở hữu.
 * - Xem các lời mời gửi nài ngựa cưỡi thi đấu.
 * - Tải dữ liệu Dashboard chủ ngựa (doanh thu giải thưởng, thứ hạng trung bình, quy mô chuồng).
 * - Tra cứu lịch sử kết quả của các con ngựa thuộc chuồng.
 */
@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
@Tag(
    name = "12. Owner & Jockey Dashboards",
    description = "📊 **BƯỚC 12: DASHBOARD THỐNG KÊ DOANH THU & CHUỒNG NGỰA (DASHBOARD ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `HorseOwnerController.java`, `JockeyController.java`\n" +
                  "* **Services**: `JockeyOwnerDashboardService.java`\n" +
                  "* **Repositories**: `HorseRepository.java`, `RaceEntryRepository.java`\n" +
                  "* **Entities**: `Horse.java`, `RaceEntry.java`\n" +
                  "* **Frontend**: `HorseOwner.tsx` (dashboards), `Jockey.tsx` (dashboards), `Spectator.tsx` (dashboards), `Statistics.tsx`, `HorsePerformanceModal.tsx`, `ProfileTab.tsx`, `horseOwnerService.ts`, `jockeyService.ts`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Chủ ngựa theo dõi tổng số tiền thưởng tích lũy (`Total Earnings`), số ngựa active trong chuồng (`Stable`).\n" +
                  "2. Xem tỷ lệ vị trí trung bình (`Avg Position`) và lịch sử các giải đua của chuồng ngựa."
)
public class HorseOwnerController {

    private final HorseService horseService; // Dịch vụ quản lý thông tin ngựa
    private final InvitationService invitationService; // Dịch vụ quản lý lời mời cưỡi ngựa
    private final JockeyOwnerDashboardService dashboardService; // Dịch vụ xử lý dữ liệu Dashboard kỵ sĩ/chủ ngựa

    // Lấy danh sách toàn bộ ngựa thuộc sở hữu của chủ ngựa theo ID chủ ngựa
    @GetMapping("/{id}/horses")
    @Operation(
        summary = "GET: Lấy danh sách ngựa của Chủ sở hữu",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `HorseOwnerController.getOwnerHorses()`\n" +
                      "* **Services**: `HorseService.getAllHorses()`\n" +
                      "* **Repositories**: `HorseRepository.findByOwnerId()`\n" +
                      "* **Entities**: `Horse.java`\n" +
                      "* **DTOs**: `HorseDTO`\n" +
                      "* **DTO Response**: `List<HorseDTO>`\n" +
                      "* **Frontend**: `HorseOwner.tsx` (dashboards), `horseOwnerService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tiếp nhận ID Chủ sở hữu từ PathVariable.\n" +
                      "2. Lấy danh sách toàn bộ chiến mã thuộc quyền sở hữu của Chủ ngựa."
    )
    public ResponseEntity<List<HorseDTO>> getOwnerHorses(@PathVariable Integer id) {
        return ResponseEntity.ok(horseService.getAllHorses(null, id)); // Trả về HTTP 200 kèm danh sách ngựa thuộc sở hữu của chủ ngựa theo ID
    }

    // Lấy danh sách lời mời (invitations) do chủ ngựa này tạo ra gửi tới các kỵ sĩ
    @GetMapping("/{id}/invitations")
    @Operation(
        summary = "GET: Lấy danh sách lời mời thi đấu của Chủ ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `HorseOwnerController.getOwnerInvitations()`\n" +
                      "* **Services**: `InvitationService.getInvitations()`\n" +
                      "* **Repositories**: `RaceInvitationRepository.findByOwnerId()`\n" +
                      "* **Entities**: `RaceInvitation.java`\n" +
                      "* **DTOs**: `RaceInvitationDTO`\n" +
                      "* **DTO Response**: `List<RaceInvitationDTO>`\n" +
                      "* **Frontend**: `HorseOwner.tsx` (dashboards), `invitationService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Lấy danh sách toàn bộ lời mời thi đấu do Chủ ngựa này khởi tạo cho các Nài ngựa."
    )
    public ResponseEntity<List<RaceInvitationDTO>> getOwnerInvitations(@PathVariable Integer id) {
        return ResponseEntity.ok(invitationService.getInvitations(null, id)); // Trả về HTTP 200 kèm danh sách lời mời thi đấu do chủ ngựa khởi tạo
    }

    // Lấy thông tin Dashboard của chủ ngựa (quy mô chuồng, tổng tiền thưởng, thứ hạng trung bình,...)
    @GetMapping("/{id}/dashboard")
    @Operation(
        summary = "GET: Lấy dữ liệu Dashboard tổng quan của Chủ ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `HorseOwnerController.getOwnerDashboard()`\n" +
                      "* **Services**: `JockeyOwnerDashboardService.getOwnerDashboard()`\n" +
                      "* **Repositories**: `HorseRepository.findByOwnerId()`, `RaceEntryRepository.findByHorseId()`\n" +
                      "* **Entities**: `Horse.java`, `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`stableSize`, `totalEarnings`, `avgPosition`, `activeHorses`, `history`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`stableSize`, `totalEarnings`, `avgPosition`, `activeHorses`, `history`)\n" +
                      "* **Frontend**: `HorseOwner.tsx` (dashboards), `horseOwnerService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tổng hợp quy mô chuồng ngựa (`stableSize`).\n" +
                      "2. Tính toán tổng tiền thưởng lũy kế thu được từ các giải đua (`totalEarnings`).\n" +
                      "3. Tính thứ hạng cán đích trung bình của chuồng ngựa (`avgPosition`)."
    )
    public ResponseEntity<Map<String, Object>> getOwnerDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerDashboard(id)); // Trả về HTTP 200 kèm dữ liệu thống kê tổng quan Dashboard của chủ ngựa
    }

    // Lấy thông tin chi tiết trạng thái hoạt động của chuồng ngựa hiện tại
    @GetMapping("/{id}/stable")
    @Operation(
        summary = "GET: Lấy danh sách chuồng ngựa của Chủ sở hữu",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `HorseOwnerController.getOwnerStable()`\n" +
                      "* **Services**: `JockeyOwnerDashboardService.getOwnerStable()`\n" +
                      "* **Repositories**: `HorseRepository.findByOwnerId()`\n" +
                      "* **Entities**: `Horse.java`\n" +
                      "* **DTOs**: `List<Map<String, Object>>`\n" +
                      "* **DTO Response**: `List<Map<String, Object>>` (`horseId`, `name`, `breed`, `rating`, `status`)\n" +
                      "* **Frontend**: `HorseOwner.tsx` (dashboards), `horseOwnerService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tra cứu danh sách chiến mã đang ở trạng thái `ACTIVE` trong chuồng ngựa."
    )
    public ResponseEntity<List<Map<String, Object>>> getOwnerStable(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerStable(id)); // Trả về HTTP 200 kèm danh sách chi tiết các chiến mã trong chuồng
    }

    // Lấy lịch sử kết quả thi đấu của các con ngựa thuộc chủ sở hữu này
    @GetMapping("/{id}/results")
    @Operation(
        summary = "GET: Lấy lịch sử kết quả thi đấu của các con ngựa thuộc Chủ sở hữu",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `HorseOwnerController.getOwnerResults()`\n" +
                      "* **Services**: `JockeyOwnerDashboardService.getOwnerResults()`\n" +
                      "* **Repositories**: `RaceEntryRepository.findByHorseId()`\n" +
                      "* **Entities**: `RaceEntry.java`\n" +
                      "* **DTOs**: `List<Map<String, Object>>`\n" +
                      "* **DTO Response**: `List<Map<String, Object>>` (`raceId`, `raceName`, `horseName`, `finalPosition`, `prizeMoney`)\n" +
                      "* **Frontend**: `HorseOwner.tsx` (dashboards), `horseOwnerService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tổng hợp lịch sử kết quả tất cả các trận đua mà các con ngựa của Chủ này từng tham gia."
    )
    public ResponseEntity<List<Map<String, Object>>> getOwnerResults(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerResults(id)); // Trả về HTTP 200 kèm danh sách lịch sử kết quả thi đấu của các con ngựa thuộc chuồng
    }
}
