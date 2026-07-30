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
@RestController // Khai báo lớp này là một Spring REST Controller để tiếp nhận request
@RequestMapping("/api/seasons") // Định nghĩa tiền tố đường dẫn URL là /api/seasons
@RequiredArgsConstructor // Tự động tạo constructor injection cho thuộc tính final seasonService
@CrossOrigin(origins = "*") // Cho phép gọi API chéo miền (CORS) từ bất kỳ origin nào
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

    private final SeasonService seasonService; // Khai báo dịch vụ xử lý nghiệp vụ mùa giải

    // Lấy toàn bộ danh sách các mùa giải đua có trong hệ thống
    @GetMapping // Xử lý yêu cầu HTTP GET gửi tới URL /api/seasons
    @Operation(
        summary = "GET: Lấy danh sách tất cả các Mùa giải đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `SeasonController.getAllSeasons()`\n" +
                      "* **Services**: `SeasonService.getAllSeasons()`\n" +
                      "* **Repositories**: `SeasonRepository.findAll()`\n" +
                      "* **Entities**: `Season.java`\n" +
                      "* **DTOs**: `SeasonDTO` (`seasonId`, `seasonName`, `startDate`, `endDate`, `status`)\n" +
                      "* **DTO Response**: `List<SeasonDTO>`\n" +
                      "* **Frontend**: `Season.tsx` (admin-workflow), `seasonService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận yêu cầu lấy danh sách Mùa giải đua từ Client/Admin UI.\n" +
                      "2. `SeasonService` truy vấn dữ liệu toàn bộ mùa giải từ `SeasonRepository`.\n" +
                      "3. Chuyển đổi danh sách `Season` entity sang `SeasonDTO` và trả về mã HTTP 200 OK."
    )
    public ResponseEntity<List<SeasonDTO>> getAllSeasons() {
        // Trả về danh sách DTO của các mùa giải cùng trạng thái HTTP 200 OK
        return ResponseEntity.ok(seasonService.getAllSeasons());
    }

    // Lấy quy định phân hạng điểm (rating) của một mùa giải theo khóa chính seasonId
    @GetMapping("/{seasonId}/rules") // Xử lý yêu cầu HTTP GET gửi tới URL /api/seasons/{seasonId}/rules
    @Operation(
        summary = "GET: Lấy danh sách quy định phân hạng theo Mùa giải",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `SeasonController.getSeasonRules()`\n" +
                      "* **Services**: `SeasonService.getSeasonRules()`\n" +
                      "* **Repositories**: `SeasonClassRuleRepository.findBySeasonId()`\n" +
                      "* **Entities**: `SeasonClassRule.java`\n" +
                      "* **DTOs**: `SeasonClassRuleDTO` (`ruleId`, `seasonId`, `className`, `minRating`, `maxRating`)\n" +
                      "* **DTO Response**: `List<SeasonClassRuleDTO>`\n" +
                      "* **Frontend**: `SeasonRulesEdit.tsx`, `Season.tsx` (admin-workflow), `seasonService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận mã định danh Mùa giải `seasonId` từ Path Variable.\n" +
                      "2. Truy vấn danh sách quy định phân hạng Class 1 -> Class 5 từ `SeasonClassRuleRepository`.\n" +
                      "3. Chuyển đổi dữ liệu sang `SeasonClassRuleDTO` và trả về danh sách phân hạng cho giao diện Admin."
    )
    public ResponseEntity<List<SeasonClassRuleDTO>> getSeasonRules(@PathVariable Integer seasonId) {
        // Trả về danh sách DTO quy định hạng thi đấu của mùa giải tương ứng và mã HTTP 200 OK
        return ResponseEntity.ok(seasonService.getSeasonRules(seasonId));
    }
}
