package com.horseracing.backend.controller;

import com.horseracing.backend.dto.ConfirmResultsRequestDTO;
import com.horseracing.backend.service.ProcessResultsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller ProcessResultsController - Lớp kiểm soát các endpoint liên quan đến xử lý kết quả sau trận đấu.
 * - Nhập kết quả thứ hạng, thời gian chạy chính thức, báo cáo giám sát của trọng tài.
 * - Tự động hóa quá trình phân bổ tiền thưởng và tính toán cập nhật điểm rating cho ngựa đua.
 */
@RestController
@RequestMapping("/api/results")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
@Tag(
    name = "11. Race Results & Payout Service",
    description = "🏁 **BƯỚC 11: NHẬP KẾT QUẢ, TÍNH TIỀN THƯỞNG & ELO RATING (RESULTS ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `ProcessResultsController.java`, `RefereeController.java`\n" +
                  "* **Services**: `ProcessResultsService.java`\n" +
                  "* **Repositories**: `RaceEntryRepository.java`, `RaceRepository.java`, `HorseRepository.java`\n" +
                  "* **Entities**: `RaceEntry.java`, `Race.java`, `Horse.java`\n" +
                  "* **DTOs**: `ConfirmResultsRequestDTO.java`\n" +
                  "* **Frontend**: `RefereeHub.tsx`, `RefereeConfirm.tsx`, `Results.tsx` (admin-workflow)\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Trọng tài nhập kết quả thứ hạng về đích 1-2-3..., thời gian chạy (`Finish Time`) và Báo cáo giám sát (`Steward Report`).\n" +
                  "2. Đổi trạng thái trận sang `OFFICIAL`.\n" +
                  "3. Tự động chia **Tiền thưởng (`Prize Money`)** cho Chủ ngựa & Nài ngựa.\n" +
                  "4. Tự động tính toán cộng/trừ **Điểm phong độ Elo Rating (`Current Rating`)** cho từng chiến mã."
)
public class ProcessResultsController {

    private final ProcessResultsService processResultsService; // Dịch vụ xử lý kết quả

    // Endpoint nhập kết quả chính thức cho cuộc đua
    @PostMapping("/confirm")
    @Operation(
        summary = "POST: Trọng tài nhập kết quả trận đua và báo cáo giám sát",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `ProcessResultsController.confirmResults()`\n" +
                      "* **Service**: `ProcessResultsService.confirmResults()`\n" +
                      "* **Repositories**: `RaceEntryRepository.save()`, `HorseRepository.save()`, `RaceRepository.save()`\n" +
                      "* **Entities**: `RaceEntry.java`, `Horse.java`, `Race.java`\n" +
                      "* **DTO Request**: `ConfirmResultsRequestDTO` (`raceId`, `stewardReport`, `results: [{entryId, finalPosition, finishTime}]`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"Results processed successfully\"}`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận payload `ConfirmResultsRequestDTO` gồm danh sách vị trí về đích của các chiến mã.\n" +
                      "2. Lưu thông tin Báo cáo giám sát (`Steward Report`) vào bản ghi `Race`.\n" +
                      "3. Đổi trạng thái `Race` sang `OFFICIAL`.\n" +
                      "4. Duyệt qua từng `RaceEntry`: Cập nhật `finalPosition`, `finishTime`, tính toán `prizeMoney` theo quỹ thưởng.\n" +
                      "5. Cập nhật chỉ số `totalWins`, `totalRaces` và tính toán lại `currentRating` cho từng chiến mã trong `HorseRepository`."
    )
    public ResponseEntity<?> confirmResults(@RequestBody ConfirmResultsRequestDTO request) {
        try {
            // Gọi tầng nghiệp vụ để lưu trữ và tính toán kết quả
            processResultsService.confirmResults(request.getRaceId(), request.getStewardReport(), request.getResults());
            // Trả về kết quả thành công
            return ResponseEntity.ok(Map.of("success", true, "message", "Results processed successfully"));
        } catch (IllegalArgumentException e) {
            // Trả về mã lỗi 400 Bad Request nếu đầu vào không hợp lệ
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
