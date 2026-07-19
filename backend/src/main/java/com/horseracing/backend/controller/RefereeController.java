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
    name = "10. Referee & Race Control Service",
    description = "👮 **BƯỚC 10: QUẢN LÝ TRỌNG TÀI & GIÁM SÁT TRẬN ĐUA (REFEREE ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `RefereeController.java`, `ProcessResultsController.java`\n" +
                  "* **Services**: `RefereeService.java` (`RefereeServiceImpl.java`), `ProcessResultsService.java` (`ProcessResultsServiceImpl.java`)\n" +
                  "* **Repositories**: `ViolationRepository.java`, `RaceRefereeRepository.java`, `RaceEntryRepository.java`\n" +
                  "* **Entities**: `Violation.java`, `RaceReferee.java`, `RaceEntry.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Pre-check cân nặng & sức khỏe chiến mã trước giờ đua (`preRaceCheck`).\n" +
                  "2. Phát lệnh khởi tranh xuất phát (`startRace`). Ghi lỗi vi phạm (`logViolation`).\n" +
                  "3. Tạm dừng khẩn cấp (`suspend/stop`) hoặc Truất quyền thi đấu (`disqualifyEntry`)."
)
public class RefereeController {

    private final RefereeService refereeService;
    private final ProcessResultsService processResultsService;

    @PostMapping("/pre-check")
    @Operation(summary = "POST: Kiểm tra cân nặng & sức khỏe trước trận đua", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.preRaceCheck()` -> `RefereeService.preRaceCheck()`")
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
    @Operation(summary = "POST: Ghi nhận lỗi vi phạm của Nài ngựa/Chiến mã", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.logViolation()` -> `RefereeService.logViolation()`")
    public ResponseEntity<?> logViolation(@RequestBody ViolationDTO violationDTO) {
        try {
            ViolationDTO saved = refereeService.logViolation(violationDTO);
            return ResponseEntity.ok(Map.of("success", true, "violation", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/results")
    @Operation(summary = "POST: Xác nhận kết quả thi đấu của trận đua", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.confirmResults()` -> `ProcessResultsService.confirmResults()`")
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
    @Operation(summary = "GET: Lấy dữ liệu Dashboard cá nhân Trọng tài", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền id Trọng tài -> 'Execute'.\n\n📌 **Code Architecture**: `RefereeController.getRefereeDashboard()` -> `RefereeService.getRefereeDashboard()`")
    public ResponseEntity<Map<String, Object>> getRefereeDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(refereeService.getRefereeDashboard(id));
    }

    @PostMapping("/races/{raceId}/stop")
    @Operation(summary = "POST: Dừng khẩn cấp trận đua", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.stopRace()` -> `RefereeService.stopRace()`")
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
    @Operation(summary = "POST: Tạm dừng trận đua đang diễn ra", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.suspendRace()` -> `RefereeService.suspendRace()`")
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
    @Operation(summary = "POST: Tiếp tục trận đua sau khi tạm dừng", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.resumeRace()` -> `RefereeService.resumeRace()`")
    public ResponseEntity<?> resumeRace(@PathVariable Integer raceId) {
        try {
            refereeService.resumeRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race has resumed. Status set to RUNNING."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/start")
    @Operation(summary = "POST: Bắt đầu xuất phát trận đua", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.startRace()` -> `RefereeService.startRace()`")
    public ResponseEntity<?> startRace(@PathVariable Integer raceId) {
        try {
            refereeService.startRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race started successfully. Status is now RUNNING."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/violations/{violationId}/confirm")
    @Operation(summary = "POST: Xác nhận lỗi vi phạm", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.confirmViolation()` -> `RefereeService.confirmViolation()`")
    public ResponseEntity<?> confirmViolation(@PathVariable Integer violationId) {
        try {
            refereeService.confirmViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation confirmed."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/violations/{violationId}/dismiss")
    @Operation(summary = "POST: Hủy bỏ lỗi vi phạm", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.dismissViolation()` -> `RefereeService.dismissViolation()`")
    public ResponseEntity<?> dismissViolation(@PathVariable Integer violationId) {
        try {
            refereeService.dismissViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation dismissed."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/stop")
    @Operation(summary = "POST: Dừng thi đấu 1 con ngựa trong trận", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.stopEntry()` -> `RefereeService.stopEntry()`")
    public ResponseEntity<?> stopEntry(@PathVariable Integer entryId) {
        try {
            refereeService.stopEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has been stopped."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/resume")
    @Operation(summary = "POST: Cho phép 1 con ngựa tiếp tục chạy", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.resumeEntry()` -> `RefereeService.resumeEntry()`")
    public ResponseEntity<?> resumeEntry(@PathVariable Integer entryId) {
        try {
            refereeService.resumeEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has resumed running."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/disqualify")
    @Operation(summary = "POST: Truất quyền thi đấu (Disqualify) 1 con ngựa", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RefereeController.disqualifyEntry()` -> `RefereeService.disqualifyEntry()`")
    public ResponseEntity<?> disqualifyEntry(@PathVariable Integer entryId) {
        try {
            refereeService.disqualifyEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has been disqualified."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
