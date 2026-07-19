package com.horseracing.backend.controller;

import com.horseracing.backend.dto.ViolationDTO;
import com.horseracing.backend.service.ProcessResultsService;
import com.horseracing.backend.service.RefereeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/referee")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(
    name = "Referee Service",
    description = "👮 **Cấu trúc Mô-đun Quản lý Trọng Tài & Giám Sát Trận Đua (Referee Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `RefereeController.java`, `ProcessResultsController.java`\n" +
                  "* **Services**: `RefereeService.java` (`RefereeServiceImpl.java`), `ProcessResultsService.java` (`ProcessResultsServiceImpl.java`)\n" +
                  "* **Repositories**: `ViolationRepository.java`, `RaceRefereeRepository.java`, `RaceEntryRepository.java`, `RaceRepository.java`\n" +
                  "* **Entities**: `Violation.java`, `RaceReferee.java`, `RaceEntry.java`, `Race.java`\n" +
                  "* **DTOs**: `ViolationDTO.java`, `ConfirmResultsRequestDTO.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Trọng tài được Admin phân công vào điều hành trận đua (`RaceReferee`).\n" +
                  "2. Trước giờ đua: Thực hiện Pre-check kiểm tra cân nặng nài ngựa và sức khỏe ngựa tại trường đua.\n" +
                  "3. Trong khi đua: Phát lệnh xuất phát (`START`), theo dõi vi phạm đường đua -> Lập biên bản xử phạt (`logViolation`). Có quyền tạm dừng khẩn cấp (`suspend/stop`) hoặc truất quyền thi đấu (`disqualify`).\n" +
                  "4. Sau khi kết thúc: Nhập thứ hạng vị trí về đích 1-2-3..., lập **Báo cáo giám sát (`Steward Report`)** và chốt kết quả chính thức (`OFFICIAL`)."
)
public class RefereeController {

    private final RefereeService refereeService;
    private final ProcessResultsService processResultsService;

    @PostMapping("/pre-check")
    @Operation(summary = "Kiểm tra cân nặng & sức khỏe ngựa trước trận đua", description = "📌 **Code Architecture**: `RefereeController.preRaceCheck()` -> `RefereeService.preRaceCheck()` -> Xác nhận đủ điều kiện thi đấu và đổi trạng thái sang `RUNNING`")
    public ResponseEntity<?> preRaceCheck(@RequestBody Map<String, Object> request) {
        try {
            Integer raceId = (Integer) request.get("raceId");
            List<Map<String, Object>> entriesData = (List<Map<String, Object>>) request.get("entries");

            refereeService.preRaceCheck(raceId, entriesData);
            return ResponseEntity.ok(Map.of("success", true, "message", "Pre-race check completed. Race is now RUNNING."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/violations")
    @Operation(summary = "Ghi nhận lỗi vi phạm của Nài ngựa/Chiến mã", description = "📌 **Code Architecture**: `RefereeController.logViolation()` -> `RefereeService.logViolation()` -> Lưu `Violation` Entity mới vào DB")
    public ResponseEntity<?> logViolation(@RequestBody ViolationDTO violationDTO) {
        try {
            ViolationDTO saved = refereeService.logViolation(violationDTO);
            return ResponseEntity.ok(Map.of("success", true, "violation", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/results")
    @Operation(summary = "Xác nhận kết quả thi đấu của trận đua", description = "📌 **Code Architecture**: `RefereeController.confirmResults()` -> `ProcessResultsService.confirmResults()` -> Tính toán kết quả chính thức và cập nhật Rating")
    public ResponseEntity<?> confirmResults(@RequestBody Map<String, Object> request) {
        try {
            Integer raceId = (Integer) request.get("raceId");
            String stewardReport = (String) request.get("stewardReport");
            List<Map<String, Object>> entriesResults = (List<Map<String, Object>>) request.get("results");

            processResultsService.confirmResults(raceId, stewardReport, entriesResults);
            return ResponseEntity.ok(Map.of("success", true, "message", "Results and weights verified. Race status set to OFFICIAL."));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/dashboard")
    @Operation(summary = "Lấy dữ liệu Dashboard cá nhân Trọng tài", description = "📌 **Code Architecture**: `RefereeController.getRefereeDashboard()` -> `RefereeService.getRefereeDashboard()` -> Lấy danh sách trận đua đang điều hành")
    public ResponseEntity<Map<String, Object>> getRefereeDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(refereeService.getRefereeDashboard(id));
    }

    @PostMapping("/races/{raceId}/stop")
    @Operation(summary = "Dừng khẩn cấp trận đua (Khẩn cấp/Hủy trận)", description = "📌 **Code Architecture**: `RefereeController.stopRace()` -> `RefereeService.stopRace()` -> Đổi trạng thái trận sang `CANCELLED`")
    public ResponseEntity<?> stopRace(@PathVariable Integer raceId, @RequestBody Map<String, String> body) {
        try {
            String stewardReport = body.get("stewardReport");
            refereeService.stopRace(raceId, stewardReport);
            return ResponseEntity.ok(Map.of("success", true, "message", "Emergency stop executed. Race status set to CANCELLED."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/suspend")
    @Operation(summary = "Tạm dừng trận đua đang diễn ra", description = "📌 **Code Architecture**: `RefereeController.suspendRace()` -> `RefereeService.suspendRace()` -> Đổi trạng thái trận sang `STOPPED`")
    public ResponseEntity<?> suspendRace(@PathVariable Integer raceId, @RequestBody Map<String, String> body) {
        try {
            String stewardReport = body.get("stewardReport");
            refereeService.suspendRace(raceId, stewardReport);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race has been suspended. Status set to STOPPED."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/resume")
    @Operation(summary = "Tiếp tục trận đua sau khi tạm dừng", description = "📌 **Code Architecture**: `RefereeController.resumeRace()` -> `RefereeService.resumeRace()` -> Đổi trạng thái trận sang `RUNNING`")
    public ResponseEntity<?> resumeRace(@PathVariable Integer raceId) {
        try {
            refereeService.resumeRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race has resumed. Status set to RUNNING."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/start")
    @Operation(summary = "Bắt đầu xuất phát trận đua", description = "📌 **Code Architecture**: `RefereeController.startRace()` -> `RefereeService.startRace()` -> Phát lệnh mở cổng xuất phát và đổi trạng thái sang `RUNNING`")
    public ResponseEntity<?> startRace(@PathVariable Integer raceId) {
        try {
            refereeService.startRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race started successfully. Status is now RUNNING."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/violations/{violationId}/confirm")
    @Operation(summary = "Xác nhận lỗi vi phạm", description = "📌 **Code Architecture**: `RefereeController.confirmViolation()` -> `RefereeService.confirmViolation()` -> Đổi status vi phạm sang `CONFIRMED`")
    public ResponseEntity<?> confirmViolation(@PathVariable Integer violationId) {
        try {
            refereeService.confirmViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation confirmed."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/violations/{violationId}/dismiss")
    @Operation(summary = "Hủy bỏ lỗi vi phạm", description = "📌 **Code Architecture**: `RefereeController.dismissViolation()` -> `RefereeService.dismissViolation()` -> Đổi status vi phạm sang `DISMISSED`")
    public ResponseEntity<?> dismissViolation(@PathVariable Integer violationId) {
        try {
            refereeService.dismissViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation dismissed."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/stop")
    @Operation(summary = "Dừng thi đấu 1 con ngựa trong trận", description = "📌 **Code Architecture**: `RefereeController.stopEntry()` -> `RefereeService.stopEntry()` -> Dừng 1 chiến mã cụ thể")
    public ResponseEntity<?> stopEntry(@PathVariable Integer entryId) {
        try {
            refereeService.stopEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has been stopped."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/resume")
    @Operation(summary = "Cho phép 1 con ngựa tiếp tục chạy", description = "📌 **Code Architecture**: `RefereeController.resumeEntry()` -> `RefereeService.resumeEntry()` -> Cho phép chiến mã chạy tiếp")
    public ResponseEntity<?> resumeEntry(@PathVariable Integer entryId) {
        try {
            refereeService.resumeEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has resumed running."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/disqualify")
    @Operation(summary = "Truất quyền thi đấu (Disqualify) 1 con ngựa", description = "📌 **Code Architecture**: `RefereeController.disqualifyEntry()` -> `RefereeService.disqualifyEntry()` -> Loại chiến mã khỏi kết quả trận đua")
    public ResponseEntity<?> disqualifyEntry(@PathVariable Integer entryId) {
        try {
            refereeService.disqualifyEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has been disqualified."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
