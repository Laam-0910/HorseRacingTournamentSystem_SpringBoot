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

@RestController
@RequestMapping("/api/owner")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(
    name = "12. Owner & Jockey Dashboards",
    description = "📊 **BƯỚC 12: DASHBOARD THỐNG KÊ DOANH THU & CHUỒNG NGỰA (DASHBOARD ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `HorseOwnerController.java`, `JockeyController.java`\n" +
                  "* **Services**: `JockeyOwnerDashboardService.java` (`JockeyOwnerDashboardServiceImpl.java`)\n" +
                  "* **Repositories**: `HorseRepository.java`, `RaceEntryRepository.java`\n" +
                  "* **Entities**: `Horse.java`, `RaceEntry.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Chủ ngựa theo dõi tổng số tiền thưởng tích lũy (`Total Earnings`), số ngựa active trong chuồng (`Stable`).\n" +
                  "2. Xem tỷ lệ vị trí trung bình (`Avg Position`) và lịch sử các giải đua của chuồng ngựa."
)
public class HorseOwnerController {

    private final HorseService horseService;
    private final InvitationService invitationService;
    private final JockeyOwnerDashboardService dashboardService;

    @GetMapping("/{id}/horses")
    @Operation(
        summary = "GET: Lấy danh sách ngựa của Chủ sở hữu",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền id Chủ ngựa -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseOwnerController.getOwnerHorses()`\n" +
                      "* **Service**: `HorseService.getAllHorses()` (`HorseServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRepository.findByOwnerId()`\n" +
                      "* **Entity**: `Horse.java`\n" +
                      "* **DTO Response**: `List<HorseDTO>`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tiếp nhận ID Chủ sở hữu từ PathVariable.\n" +
                      "2. Lấy danh sách toàn bộ chiến mã thuộc quyền sở hữu của Chủ ngựa."
    )
    public ResponseEntity<List<HorseDTO>> getOwnerHorses(@PathVariable Integer id) {
        return ResponseEntity.ok(horseService.getAllHorses(null, id));
    }

    @GetMapping("/{id}/invitations")
    @Operation(
        summary = "GET: Lấy danh sách lời mời thi đấu của Chủ ngựa",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền id Chủ ngựa -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseOwnerController.getOwnerInvitations()`\n" +
                      "* **Service**: `InvitationService.getInvitations()` (`InvitationServiceImpl.java`)\n" +
                      "* **Repository**: `RaceInvitationRepository.findByOwnerId()`\n" +
                      "* **DTO Response**: `List<RaceInvitationDTO>`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Lấy danh sách toàn bộ lời mời thi đấu do Chủ ngựa này khởi tạo cho các Nài ngựa."
    )
    public ResponseEntity<List<RaceInvitationDTO>> getOwnerInvitations(@PathVariable Integer id) {
        return ResponseEntity.ok(invitationService.getInvitations(null, id));
    }

    @GetMapping("/{id}/dashboard")
    @Operation(
        summary = "GET: Lấy dữ liệu Dashboard tổng quan của Chủ ngựa",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền id Chủ ngựa -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseOwnerController.getOwnerDashboard()`\n" +
                      "* **Service**: `JockeyOwnerDashboardService.getOwnerDashboard()` (`JockeyOwnerDashboardServiceImpl.java`)\n" +
                      "* **Repositories**: `HorseRepository.findByOwnerId()`, `RaceEntryRepository.findByHorseId()`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`stableSize`, `totalEarnings`, `avgPosition`, `activeHorses`, `history`)\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tổng hợp quy mô chuồng ngựa (`stableSize`).\n" +
                      "2. Tính toán tổng tiền thưởng lũy kế thu được từ các giải đua (`totalEarnings`).\n" +
                      "3. Tính thứ hạng cán đích trung bình của chuồng ngựa (`avgPosition`)."
    )
    public ResponseEntity<Map<String, Object>> getOwnerDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerDashboard(id));
    }

    @GetMapping("/{id}/stable")
    @Operation(
        summary = "GET: Lấy danh sách chuồng ngựa của Chủ sở hữu",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền id Chủ ngựa -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseOwnerController.getOwnerStable()`\n" +
                      "* **Service**: `JockeyOwnerDashboardService.getOwnerStable()` (`JockeyOwnerDashboardServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRepository.findByOwnerId()`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tra cứu danh sách chiến mã đang ở trạng thái `ACTIVE` trong chuồng ngựa."
    )
    public ResponseEntity<List<Map<String, Object>>> getOwnerStable(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerStable(id));
    }

    @GetMapping("/{id}/results")
    @Operation(
        summary = "GET: Lấy lịch sử kết quả thi đấu của các con ngựa thuộc Chủ sở hữu",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền id Chủ ngựa -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `HorseOwnerController.getOwnerResults()`\n" +
                      "* **Service**: `JockeyOwnerDashboardService.getOwnerResults()` (`JockeyOwnerDashboardServiceImpl.java`)\n" +
                      "* **Repository**: `RaceEntryRepository.findByHorseId()`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tổng hợp lịch sử kết quả tất cả các trận đua mà các con ngựa của Chủ này từng tham gia."
    )
    public ResponseEntity<List<Map<String, Object>>> getOwnerResults(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerResults(id));
    }
}
