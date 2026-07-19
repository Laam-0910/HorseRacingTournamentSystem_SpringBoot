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
    @Operation(
        summary = "POST: Kiểm tra cân nặng & sức khỏe trước trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.preRaceCheck()`\n" +
                      "* **Service**: `RefereeService.preRaceCheck()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repositories**: `RaceEntryRepository.save()`, `RaceRepository.save()`\n" +
                      "* **Entities**: `RaceEntry.java`, `Race.java`\n" +
                      "* **DTO Request**: `Map<String, Object>` (`raceId`, `entries: [{entryId, actualWeight}]`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận kết quả kiểm tra cân nặng thực tế của từng chiến mã trước giờ đua.\n" +
                      "2. Lưu cân nặng thực tế (`actualWeight`) vào bản ghi `RaceEntry`.\n" +
                      "3. Đổi trạng thái `Race` sang `RUNNING` để bắt đầu theo dõi trận đua."
    )
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
    @Operation(
        summary = "POST: Ghi nhận lỗi vi phạm của Nài ngựa/Chiến mã",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.logViolation()`\n" +
                      "* **Service**: `RefereeService.logViolation()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repository**: `ViolationRepository.save()`\n" +
                      "* **Entity**: `Violation.java`\n" +
                      "* **DTO Request**: `ViolationDTO` (`raceId`, `jockeyId`, `horseId`, `description`, `type`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"violation\": ViolationDTO}`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài nhập thông tin vi phạm (Loại vi phạm, Mô tả, Nài ngựa/Ngựa vi phạm).\n" +
                      "2. Lưu bản ghi `Violation` vào cơ sở dữ liệu với trạng thái `PENDING`.\n" +
                      "3. Trả về thông tin biên bản vi phạm vừa tạo."
    )
    public ResponseEntity<?> logViolation(@RequestBody ViolationDTO violationDTO) {
        try {
            ViolationDTO saved = refereeService.logViolation(violationDTO);
            return ResponseEntity.ok(Map.of("success", true, "violation", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/results")
    @Operation(
        summary = "POST: Xác nhận kết quả thi đấu của trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.confirmResults()`\n" +
                      "* **Service**: `ProcessResultsService.confirmResults()` (`ProcessResultsServiceImpl.java`)\n" +
                      "* **Repositories**: `RaceEntryRepository.save()`, `HorseRepository.save()`, `RaceRepository.save()`\n" +
                      "* **DTO Request**: `Map<String, Object>` (`raceId`, `stewardReport`, `results: [{entryId, finalPosition, finishTime}]`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài nhập thứ hạng cán đích và Báo cáo giám sát (`stewardReport`).\n" +
                      "2. Đổi trạng thái `Race` sang `OFFICIAL`.\n" +
                      "3. Tự động tính tiền thưởng (`prizeMoney`) và Rating (`currentRating`) cho từng chiến mã."
    )
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
    @Operation(
        summary = "GET: Lấy dữ liệu Dashboard cá nhân Trọng tài",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền id Trọng tài -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.getRefereeDashboard()`\n" +
                      "* **Service**: `RefereeService.getRefereeDashboard()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRefereeRepository.findByRefereeId()`, `ViolationRepository.findAll()`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`totalRacesRefereed`, `totalViolationsIssued`)\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Đếm tổng số trận đua mà Trọng tài này đã giám sát.\n" +
                      "2. Thống kê số biên bản vi phạm đã lập trong các trận đua."
    )
    public ResponseEntity<Map<String, Object>> getRefereeDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(refereeService.getRefereeDashboard(id));
    }

    @PostMapping("/races/{raceId}/start")
    @Operation(
        summary = "POST: Bắt đầu xuất phát trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.startRace()`\n" +
                      "* **Service**: `RefereeService.startRace()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRepository.save()`\n" +
                      "* **Entity**: `Race.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra trận đua đang ở trạng thái hợp lệ (`SCHEDULED`).\n" +
                      "2. Đổi trạng thái `Race` sang `RUNNING`, ghi lại thời gian xuất phát thực tế.\n" +
                      "3. Trả về kết quả bắt đầu trận đua thành công."
    )
    public ResponseEntity<?> startRace(@PathVariable Integer raceId) {
        try {
            refereeService.startRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race started successfully. Status is now RUNNING."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/stop")
    @Operation(
        summary = "POST: Dừng khẩn cấp trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.stopRace()`\n" +
                      "* **Service**: `RefereeService.stopRace()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRepository.save()`\n" +
                      "* **DTO Request**: `Map<String, String>` (`stewardReport`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận lý do dừng khẩn cấp (`stewardReport`).\n" +
                      "2. Đổi trạng thái `Race` sang `CANCELLED`.\n" +
                      "3. Ghi nhận Báo cáo giám sát và thời gian dừng vào bản ghi trận đua."
    )
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
    @Operation(
        summary = "POST: Tạm dừng trận đua đang diễn ra",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.suspendRace()`\n" +
                      "* **Service**: `RefereeService.suspendRace()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRepository.save()`\n" +
                      "* **DTO Request**: `Map<String, String>` (`stewardReport`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận lý do tạm dừng (`stewardReport`).\n" +
                      "2. Đổi trạng thái `Race` sang `STOPPED` để tạm dừng theo dõi."
    )
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
    @Operation(
        summary = "POST: Tiếp tục trận đua sau khi tạm dừng",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.resumeRace()`\n" +
                      "* **Service**: `RefereeService.resumeRace()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra trận đua đang ở trạng thái `STOPPED`.\n" +
                      "2. Đổi trạng thái `Race` về `RUNNING` để tiếp tục theo dõi."
    )
    public ResponseEntity<?> resumeRace(@PathVariable Integer raceId) {
        try {
            refereeService.resumeRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race has resumed. Status set to RUNNING."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/violations/{violationId}/confirm")
    @Operation(
        summary = "POST: Xác nhận lỗi vi phạm",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.confirmViolation()`\n" +
                      "* **Service**: `RefereeService.confirmViolation()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repository**: `ViolationRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài xác nhận biên bản vi phạm theo `violationId`.\n" +
                      "2. Cập nhật trạng thái `Violation` sang `APPROVED`."
    )
    public ResponseEntity<?> confirmViolation(@PathVariable Integer violationId) {
        try {
            refereeService.confirmViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation confirmed."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/violations/{violationId}/dismiss")
    @Operation(
        summary = "POST: Hủy bỏ lỗi vi phạm",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.dismissViolation()`\n" +
                      "* **Service**: `RefereeService.dismissViolation()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repository**: `ViolationRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài hủy bỏ biên bản vi phạm sau khi xem xét lại.\n" +
                      "2. Cập nhật trạng thái `Violation` sang `DISMISSED`."
    )
    public ResponseEntity<?> dismissViolation(@PathVariable Integer violationId) {
        try {
            refereeService.dismissViolation(violationId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation dismissed."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/stop")
    @Operation(
        summary = "POST: Dừng thi đấu 1 con ngựa trong trận",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.stopEntry()`\n" +
                      "* **Service**: `RefereeService.stopEntry()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repository**: `RaceEntryRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài ra lệnh dừng cho 1 chiến mã cụ thể theo `entryId`.\n" +
                      "2. Đổi trạng thái `RaceEntry` sang `STOPPED`."
    )
    public ResponseEntity<?> stopEntry(@PathVariable Integer entryId) {
        try {
            refereeService.stopEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has been stopped."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/resume")
    @Operation(
        summary = "POST: Cho phép 1 con ngựa tiếp tục chạy",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.resumeEntry()`\n" +
                      "* **Service**: `RefereeService.resumeEntry()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repository**: `RaceEntryRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài cho phép chiến mã tiếp tục thi đấu sau khi dừng.\n" +
                      "2. Đổi trạng thái `RaceEntry` về `RUNNING`."
    )
    public ResponseEntity<?> resumeEntry(@PathVariable Integer entryId) {
        try {
            refereeService.resumeEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has resumed running."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entry/{entryId}/disqualify")
    @Operation(
        summary = "POST: Truất quyền thi đấu (Disqualify) 1 con ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RefereeController.disqualifyEntry()`\n" +
                      "* **Service**: `RefereeService.disqualifyEntry()` (`RefereeServiceImpl.java`)\n" +
                      "* **Repository**: `RaceEntryRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài truất quyền chiến mã theo `entryId` do vi phạm nghiêm trọng.\n" +
                      "2. Đổi trạng thái `RaceEntry` sang `DISQUALIFIED`."
    )
    public ResponseEntity<?> disqualifyEntry(@PathVariable Integer entryId) {
        try {
            refereeService.disqualifyEntry(entryId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has been disqualified."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
