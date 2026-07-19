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
    name = "Horse Owner Service",
    description = "👑 **Cấu trúc Mô-đun Quản lý Chuồng Ngựa & Dashboard Chủ Ngựa (Owner Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `HorseOwnerController.java`\n" +
                  "* **Services**: `JockeyOwnerDashboardService.java`, `HorseService.java`, `InvitationService.java`\n" +
                  "* **Repositories**: `HorseRepository.java`, `RaceInvitationRepository.java`, `RaceEntryRepository.java`\n" +
                  "* **Entities**: `User.java` (roleId = 2), `Horse.java`, `RaceInvitation.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Chủ ngựa theo dõi tổng quan chuồng ngựa (`Stable`), kiểm tra số lượng chiến mã đang hoạt động.\n" +
                  "2. Gửi lời mời tới Nài ngựa (`Jockey`) bắt cặp cho từng giải đua cụ thể.\n" +
                  "3. Đăng ký cho các chiến mã tham gia Ngày đua (`Race Meeting`).\n" +
                  "4. Xem báo cáo tổng doanh thu tiền thưởng (`Total Earnings`), vị trí trung bình (`Avg Position`) trên Dashboard."
)
public class HorseOwnerController {

    private final HorseService horseService;
    private final InvitationService invitationService;
    private final JockeyOwnerDashboardService dashboardService;

    @GetMapping("/{id}/horses")
    @Operation(summary = "Lấy danh sách ngựa của Chủ sở hữu", description = "📌 **Code Architecture**: `HorseOwnerController.getOwnerHorses()` -> `HorseService.getAllHorses(null, ownerId)` -> `HorseRepository.findByOwnerId()`")
    public ResponseEntity<List<HorseDTO>> getOwnerHorses(@PathVariable Integer id) {
        return ResponseEntity.ok(horseService.getAllHorses(null, id));
    }

    @GetMapping("/{id}/invitations")
    @Operation(summary = "Lấy danh sách lời mời thi đấu của Chủ ngựa", description = "📌 **Code Architecture**: `HorseOwnerController.getOwnerInvitations()` -> `InvitationService.getInvitations(null, ownerId)` -> `RaceInvitationRepository.findByOwnerId()`")
    public ResponseEntity<List<RaceInvitationDTO>> getOwnerInvitations(@PathVariable Integer id) {
        return ResponseEntity.ok(invitationService.getInvitations(null, id));
    }

    @GetMapping("/{id}/dashboard")
    @Operation(summary = "Lấy dữ liệu Dashboard tổng quan của Chủ ngựa", description = "📌 **Code Architecture**: `HorseOwnerController.getOwnerDashboard()` -> `JockeyOwnerDashboardService.getOwnerDashboard()` -> Tổng hợp tổng thu nhập, tổng số ngựa, số lượt thắng")
    public ResponseEntity<Map<String, Object>> getOwnerDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerDashboard(id));
    }

    @GetMapping("/{id}/stable")
    @Operation(summary = "Lấy danh sách chuồng ngựa của Chủ sở hữu", description = "📌 **Code Architecture**: `HorseOwnerController.getOwnerStable()` -> `JockeyOwnerDashboardService.getOwnerStable()` -> Truy vấn các chiến mã thuộc sở hữu")
    public ResponseEntity<List<Map<String, Object>>> getOwnerStable(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerStable(id));
    }

    @GetMapping("/{id}/results")
    @Operation(summary = "Lấy lịch sử kết quả thi đấu của các con ngựa thuộc Chủ sở hữu", description = "📌 **Code Architecture**: `HorseOwnerController.getOwnerResults()` -> `JockeyOwnerDashboardService.getOwnerResults()` -> Truy vấn lịch sử `RaceEntry` của các con ngựa")
    public ResponseEntity<List<Map<String, Object>>> getOwnerResults(@PathVariable Integer id) {
        return ResponseEntity.ok(dashboardService.getOwnerResults(id));
    }
}
