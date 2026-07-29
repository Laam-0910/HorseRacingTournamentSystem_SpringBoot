package com.horseracing.backend.controller;

import com.horseracing.backend.dto.SeasonClassRuleDTO;
import com.horseracing.backend.dto.SeasonDTO;
import com.horseracing.backend.service.SeasonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller SeasonController - Lớp kiểm soát các endpoint liên quan đến mùa giải đua (Season).
 * - Cung cấp thông tin danh sách toàn bộ mùa giải.
 * - Cung cấp các quy định phân hạng điểm rating tương ứng với từng mùa giải được chỉ định.
 */
@RestController
@RequestMapping("/api/seasons")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Cho phép gọi API chéo miền
@Tag(
    name = "03. Season & Class Rule Service",
    description = "🏆 **BƯỚC 3: QUẢN LÝ MÙA GIẢI & QUY ĐỊNH HẠNG (SEASON ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `SeasonController.java`, `RaceController.java`\n" +
                  "* **Services**: `SeasonService.java`\n" +
                  "* **Repositories**: `SeasonRepository.java`, `SeasonClassRuleRepository.java`\n" +
                  "* **Entities**: `Season.java`, `SeasonClassRule.java`\n" +
                  "* **DTOs**: `SeasonDTO.java`, `SeasonClassRuleDTO.java`\n" +
                  "* **Frontend**: `Season.tsx` (admin-workflow), `SeasonRulesEdit.tsx`, `seasonService.ts`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Khởi tạo Mùa giải đua mới (gồm Tên mùa giải, Thời gian bắt đầu/kết thúc).\n" +
                  "2. Thiết lập Quy định phân hạng Rating (Class 1 -> Class 5) cho Mùa giải."
)
public class SeasonController {

    private final SeasonService seasonService; // Khai báo dịch vụ mùa giải

    // Lấy toàn bộ danh sách các mùa giải đua có trong hệ thống
    @GetMapping
    @Operation(
        summary = "GET: Lấy danh sách tất cả các Mùa giải đua",
        description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute' để xem danh sách toàn bộ các Mùa giải.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `SeasonController.getAllSeasons()`\n" +
                      "* **Service**: `SeasonService.getAllSeasons()`\n" +
                      "* **Repository**: `SeasonRepository.findAll()`\n" +
                      "* **DTO Response**: `List<SeasonDTO>`"
    )
    public ResponseEntity<List<SeasonDTO>> getAllSeasons() {
        // Trả về danh sách DTO của các mùa giải
        return ResponseEntity.ok(seasonService.getAllSeasons());
    }

    // Lấy quy định phân hạng điểm (rating) của một mùa giải theo khóa chính seasonId
    @GetMapping("/{seasonId}/rules")
    @Operation(
        summary = "GET: Lấy danh sách quy định phân hạng theo Mùa giải",
        description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền seasonId -> 'Execute' để xem quy định phân hạng.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `SeasonController.getSeasonRules()`\n" +
                      "* **Service**: `SeasonService.getSeasonRules()`\n" +
                      "* **Repository**: `SeasonClassRuleRepository.findBySeasonId()`\n" +
                      "* **DTO Response**: `List<SeasonClassRuleDTO>`"
    )
    public ResponseEntity<List<SeasonClassRuleDTO>> getSeasonRules(@PathVariable Integer seasonId) {
        // Trả về danh sách DTO quy định hạng
        return ResponseEntity.ok(seasonService.getSeasonRules(seasonId));
    }
}
