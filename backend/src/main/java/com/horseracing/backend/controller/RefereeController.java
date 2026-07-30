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

/**
 * Controller RefereeController - Lớp kiểm soát các endpoint liên quan đến công tác trọng tài và kiểm soát trận đấu.
 * - Kiểm tra trước trận đua (cân nặng thực tế, đổi trạng thái sang RUNNING).
 * - Ghi nhận và xử lý các lỗi vi phạm của ngựa/kỵ sĩ trên đường chạy.
 * - Phê duyệt hoặc hủy bỏ biên bản vi phạm đã lập.
 * - Phát lệnh xuất phát, tạm dừng, dừng khẩn cấp hoặc tiếp tục trận đấu.
 * - Điều khiển trạng thái chạy của từng ngựa đua (Dừng chạy, Chạy tiếp, Truất quyền thi đấu).
 * - Xác nhận kết quả thi đấu chính thức (đổi trạng thái sang OFFICIAL và tính Elo/tiền thưởng).
 */
@RestController
@RequestMapping("/api/referee")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
@Tag(
    name = "10. Referee & Race Control Service",
    description = "👮 **BƯỚC 10: QUẢN LÝ TRỌNG TÀI & GIÁM SÁT TRẬN ĐUA (REFEREE ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `RefereeController.java`, `ProcessResultsController.java`\n" +
                  "* **Services**: `RefereeService.java`, `ProcessResultsService.java`\n" +
                  "* **Repositories**: `ViolationRepository.java`, `RaceRefereeRepository.java`, `RaceEntryRepository.java`\n" +
                  "* **Entities**: `Violation.java`, `RaceReferee.java`, `RaceEntry.java`\n" +
                  "* **Frontend**: `RefereeHub.tsx`, `RefereeDuties.tsx`, `RefereeCheck.tsx`, `RefereeConfirm.tsx`, `RefereeIncidents.tsx`, `RefereeSupervision.tsx`, `Referee.tsx` (dashboards), `refereeService.ts`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Pre-check cân nặng & sức khỏe chiến mã trước giờ đua (`preRaceCheck`).\n" +
                  "2. Phát lệnh khởi tranh xuất phát (`startRace`). Ghi lỗi vi phạm (`logViolation`).\n" +
                  "3. Tạm dừng khẩn cấp (`suspend/stop`) hoặc Truất quyền thi đấu (`disqualifyEntry`)."
)
public class RefereeController {

    private final RefereeService refereeService; // Dịch vụ trọng tài điều khiển đường đua
    private final ProcessResultsService processResultsService; // Dịch vụ xử lý kết quả cuộc đua

    // Thực hiện kiểm tra thông số cân nặng thực tế và sức khỏe của chiến mã trước giờ xuất phát
    @PostMapping("/pre-check")
    @Operation(
        summary = "POST: Kiểm tra cân nặng & sức khỏe trước trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.preRaceCheck()`\n" +
                      "* **Services**: `RefereeService.preRaceCheck()`\n" +
                      "* **Repositories**: `RaceEntryRepository.save()`, `RaceRepository.save()`\n" +
                      "* **Entities**: `RaceEntry.java`, `Race.java`\n" +
                      "* **DTO Request**: `Map<String, Object>` (`raceId`, `entries: [{entryId, actualWeight}]`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RefereeCheck.tsx`, `RefereeHub.tsx`, `refereeService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận kết quả kiểm tra cân nặng thực tế của từng chiến mã trước giờ đua.\n" +
                      "2. Lưu cân nặng thực tế (`actualWeight`) vào bản ghi `RaceEntry`.\n" +
                      "3. Đổi trạng thái `Race` sang `RUNNING` để bắt đầu theo dõi trận đua."
    )
    public ResponseEntity<?> preRaceCheck(@RequestBody Map<String, Object> request) {
        try { // Khối xử lý ngoại lệ khi kiểm tra trước trận đua
            Integer raceId = (Integer) request.get("raceId"); // Trích xuất mã trận đua raceId từ request body
            List<Map<String, Object>> entriesData = (List<Map<String, Object>>) request.get("entries"); // Trích xuất danh sách thông tin ngựa tham gia
            refereeService.preRaceCheck(raceId, entriesData); // Gọi service thực hiện kiểm tra cân nặng và sức khỏe trước trận đua
            return ResponseEntity.ok(Map.of("success", true, "message", "Pre-race check completed. Race is now RUNNING.")); // Trả về HTTP 200 thông báo kiểm tra hoàn tất
        } catch (IllegalArgumentException e) { // Bắt ngoại lệ tham số không hợp lệ
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Trọng tài lập biên bản ghi lỗi vi phạm luật thi đấu của kỵ sĩ/ngựa đua
    @PostMapping("/violations")
    @Operation(
        summary = "POST: Ghi nhận lỗi vi phạm của Nài ngựa/Chiến mã",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.logViolation()`\n" +
                      "* **Services**: `RefereeService.logViolation()`\n" +
                      "* **Repositories**: `ViolationRepository.save()`\n" +
                      "* **Entities**: `Violation.java`\n" +
                      "* **DTO Request**: `ViolationDTO` (`raceId`, `jockeyId`, `horseId`, `description`, `type`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"violation\": ViolationDTO}`)\n" +
                      "* **Frontend**: `RefereeIncidents.tsx`, `RefereeHub.tsx`, `refereeService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài nhập thông tin vi phạm (Loại vi phạm, Mô tả, Nài ngựa/Ngựa vi phạm).\n" +
                      "2. Lưu bản ghi `Violation` vào cơ sở dữ liệu với trạng thái `PENDING`.\n" +
                      "3. Trả về thông tin biên bản vi phạm vừa tạo."
    )
    public ResponseEntity<?> logViolation(@RequestBody ViolationDTO violationDTO) {
        try { // Khối xử lý ngoại lệ khi ghi nhận lỗi vi phạm
            ViolationDTO saved = refereeService.logViolation(violationDTO); // Gọi service lưu biên bản vi phạm luật thi đấu
            return ResponseEntity.ok(Map.of("success", true, "violation", saved)); // Trả về HTTP 200 kèm DTO vi phạm vừa tạo
        } catch (Exception e) { // Bắt ngoại lệ nếu ghi nhận vi phạm thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Trọng tài gửi chốt kết quả thứ hạng, thời gian chạy và báo cáo của giám sát đường đua
    @PostMapping("/results")
    @Operation(
        summary = "POST: Xác nhận kết quả thi đấu của trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.confirmResults()`\n" +
                      "* **Services**: `ProcessResultsService.confirmResults()`\n" +
                      "* **Repositories**: `RaceEntryRepository.save()`, `HorseRepository.save()`, `RaceRepository.save()`\n" +
                      "* **DTO Request**: `Map<String, Object>` (`raceId`, `stewardReport`, `results: [{entryId, finalPosition, finishTime}]`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RefereeConfirm.tsx`, `RefereeHub.tsx`, `refereeService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài nhập thứ hạng cán đích và Báo cáo giám sát (`stewardReport`).\n" +
                      "2. Đổi trạng thái `Race` sang `OFFICIAL`.\n" +
                      "3. Tự động tính tiền thưởng (`prizeMoney`) và Rating (`currentRating`) cho từng chiến mã."
    )
    public ResponseEntity<?> confirmResults(@RequestBody Map<String, Object> request) {
        try { // Khối xử lý ngoại lệ khi xác nhận kết quả thi đấu
            Integer raceId = (Integer) request.get("raceId"); // Trích xuất mã trận đua raceId từ request
            String stewardReport = (String) request.get("stewardReport"); // Trích xuất báo cáo giám sát stewardReport
            List<Map<String, Object>> entriesResults = (List<Map<String, Object>>) request.get("results"); // Trích xuất danh sách thứ hạng và thời gian cán đích
            processResultsService.confirmResults(raceId, stewardReport, entriesResults); // Gọi service xử lý chốt kết quả thi đấu chính thức
            return ResponseEntity.ok(Map.of("success", true, "message", "Results and weights verified. Race status set to OFFICIAL.")); // Trả về HTTP 200 thông báo xác nhận kết quả thành công
        } catch (IllegalArgumentException e) { // Bắt ngoại lệ tham số không hợp lệ
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Lấy thông số Dashboard thống kê hiệu suất giám sát của Trọng tài hiện tại
    @GetMapping("/{id}/dashboard")
    @Operation(
        summary = "GET: Lấy dữ liệu Dashboard cá nhân Trọng tài",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.getRefereeDashboard()`\n" +
                      "* **Services**: `RefereeService.getRefereeDashboard()`\n" +
                      "* **Repositories**: `RaceRefereeRepository.findByRefereeId()`, `ViolationRepository.findAll()`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`totalRacesRefereed`, `totalViolationsIssued`)\n" +
                      "* **Frontend**: `Referee.tsx` (dashboards), `RefereeHub.tsx`, `refereeService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Đếm tổng số trận đua mà Trọng tài này đã giám sát.\n" +
                      "2. Thống kê số biên bản vi phạm đã lập trong các trận đua."
    )
    public ResponseEntity<Map<String, Object>> getRefereeDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(refereeService.getRefereeDashboard(id)); // Trả về thông tin thống kê Dashboard của trọng tài theo ID
    }

    // Phát lệnh xuất phát trận đua (Đổi trạng thái từ SCHEDULED sang RUNNING)
    @PostMapping("/races/{raceId}/start")
    @Operation(
        summary = "POST: Bắt đầu xuất phát trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.startRace()`\n" +
                      "* **Services**: `RefereeService.startRace()`\n" +
                      "* **Repositories**: `RaceRepository.save()`\n" +
                      "* **Entities**: `Race.java`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RefereeSupervision.tsx`, `RefereeHub.tsx`, `refereeService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra trận đua đang ở trạng thái hợp lệ (`SCHEDULED`).\n" +
                      "2. Đổi trạng thái `Race` sang `RUNNING`, ghi lại thời gian xuất phát thực tế.\n" +
                      "3. Trả về kết quả bắt đầu trận đua thành công."
    )
    public ResponseEntity<?> startRace(@PathVariable Integer raceId) {
        try { // Khối xử lý ngoại lệ khi bắt đầu trận đua
            refereeService.startRace(raceId); // Gọi service phát lệnh bắt đầu trận đua
            return ResponseEntity.ok(Map.of("success", true, "message", "Race started successfully. Status is now RUNNING.")); // Trả về HTTP 200 thông báo xuất phát thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu xuất phát thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm lý do lỗi
        }
    }

    // Phát lệnh dừng khẩn cấp trận đua (Hủy trận đua)
    @PostMapping("/races/{raceId}/stop")
    @Operation(
        summary = "POST: Dừng khẩn cấp trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.stopRace()`\n" +
                      "* **Services**: `RefereeService.stopRace()`\n" +
                      "* **Repositories**: `RaceRepository.save()`, `RaceEntryRepository.findByRaceId()`, `RaceEntryRepository.save()`\n" +
                      "* **DTO Request**: `Map<String, String>` (`stewardReport`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)  |  `{\"success\": false, \"error\": \"...\"}` khi thất bại\n" +
                      "* **Frontend**: `RefereeHub.tsx` → `handleStopRace()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra trận đua phải đang ở trạng thái `RUNNING`, `STOPPED` hoặc `STEWARDS_INQUIRY`. Nếu không, ném `IllegalStateException` → HTTP 400.\n" +
                      "2. Chuyển trạng thái `Race` sang `CANCELLED` và ghi nhận `stewardReport` + xóa URL livestream.\n" +
                      "3. Duyệt danh sách `RaceEntry`: chỉ chuyển sang `REJECTED` các entry đang ở trạng thái `APPROVED`, `RUNNING`, `STOPPED`, `PENDING_ADMIN`.\n" +
                      "4. Entry đã là `DISQUALIFIED` hoặc `FINISHED` được giữ nguyên trạng thái."
    )
    public ResponseEntity<?> stopRace(@PathVariable Integer raceId, @RequestBody Map<String, String> body) {
        try { // Khối xử lý ngoại lệ khi dừng khẩn cấp trận đua
            String stewardReport = body.get("stewardReport"); // Lấy báo cáo lý do dừng khẩn cấp từ body
            refereeService.stopRace(raceId, stewardReport); // Gọi service thực thi dừng khẩn cấp trận đua
            return ResponseEntity.ok(Map.of("success", true, "message", "Emergency stop executed. Race status set to CANCELLED.")); // Trả về HTTP 200 thông báo dừng trận đua thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu thao tác thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Tạm dừng trận đua đang diễn ra (Đổi trạng thái trận sang STOPPED)
    @PostMapping("/races/{raceId}/suspend")
    @Operation(
        summary = "POST: Tạm dừng trận đua đang diễn ra",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.suspendRace()`\n" +
                      "* **Services**: `RefereeService.suspendRace()`\n" +
                      "* **Repositories**: `RaceRepository.save()`, `RaceEntryRepository.findByRaceId()`, `RaceEntryRepository.save()`\n" +
                      "* **DTO Request**: `Map<String, String>` (`stewardReport`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RefereeHub.tsx` → `handleSuspendRace()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra trận đua đang ở trạng thái `RUNNING` hoặc `STEWARDS_INQUIRY`.\n" +
                      "2. Đổi trạng thái `Race` sang `STOPPED` và ghi nhận `stewardReport`.\n" +
                      "3. Duyệt danh sách các lượt đua `RaceEntry` của trận: chuyển trạng thái từ `RUNNING`/`APPROVED` sang `STOPPED` để đồng bộ hiển thị cho từng thí sinh."
    )
    public ResponseEntity<?> suspendRace(@PathVariable Integer raceId, @RequestBody Map<String, String> body) {
        try { // Khối xử lý ngoại lệ khi tạm dừng trận đua
            String stewardReport = body.get("stewardReport"); // Lấy báo cáo lý do tạm dừng từ body
            refereeService.suspendRace(raceId, stewardReport); // Gọi service thực hiện tạm dừng trận đua
            return ResponseEntity.ok(Map.of("success", true, "message", "Race has been suspended. Status set to STOPPED.")); // Trả về HTTP 200 thông báo tạm dừng thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu tạm dừng thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Cho phép trận đua đang bị tạm dừng (STOPPED) được chạy tiếp tục (RUNNING)
    @PostMapping("/races/{raceId}/resume")
    @Operation(
        summary = "POST: Tiếp tục trận đua sau khi tạm dừng",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.resumeRace()`\n" +
                      "* **Services**: `RefereeService.resumeRace()`\n" +
                      "* **Repositories**: `RaceRepository.save()`, `RaceEntryRepository.findByRaceId()`, `RaceEntryRepository.save()`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RefereeHub.tsx` → `handleResumeRace()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra trận đua đang ở trạng thái `STOPPED`.\n" +
                      "2. Đổi trạng thái `Race` về `RUNNING`.\n" +
                      "3. Duyệt danh sách `RaceEntry`: khôi phục trạng thái từ `STOPPED` trở lại `RUNNING` cho tất cả thí sinh tham gia."
    )
    public ResponseEntity<?> resumeRace(@PathVariable Integer raceId) {
        try { // Khối xử lý ngoại lệ khi cho trận đua chạy tiếp tục
            refereeService.resumeRace(raceId); // Gọi service tiếp tục trận đua sau tạm dừng
            return ResponseEntity.ok(Map.of("success", true, "message", "Race has resumed. Status set to RUNNING.")); // Trả về HTTP 200 thông báo tiếp tục thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu thao tác thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Trọng tài xác nhận biên bản vi phạm là hợp lệ (Chuyển trạng thái sang APPROVED)
    @PostMapping("/violations/{violationId}/confirm")
    @Operation(
        summary = "POST: Xác nhận lỗi vi phạm",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.confirmViolation()`\n" +
                      "* **Services**: `RefereeService.confirmViolation()`\n" +
                      "* **Repositories**: `ViolationRepository.save()`\n" +
                      "* **Entities**: `Violation.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RefereeIncidents.tsx`, `RefereeHub.tsx`, `refereeService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài xác nhận biên bản vi phạm theo `violationId`.\n" +
                      "2. Cập nhật trạng thái `Violation` sang `APPROVED`."
    )
    public ResponseEntity<?> confirmViolation(@PathVariable Integer violationId) {
        try { // Khối xử lý ngoại lệ khi xác nhận biên bản vi phạm
            refereeService.confirmViolation(violationId); // Gọi service xác nhận lỗi vi phạm hợp lệ
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation confirmed.")); // Trả về HTTP 200 thông báo xác nhận thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu xác nhận thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Trọng tài bác bỏ biên bản vi phạm (Chuyển trạng thái sang DISMISSED)
    @PostMapping("/violations/{violationId}/dismiss")
    @Operation(
        summary = "POST: Hủy bỏ lỗi vi phạm",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.dismissViolation()`\n" +
                      "* **Services**: `RefereeService.dismissViolation()`\n" +
                      "* **Repositories**: `ViolationRepository.save()`\n" +
                      "* **Entities**: `Violation.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RefereeIncidents.tsx`, `RefereeHub.tsx`, `refereeService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài hủy bỏ biên bản vi phạm sau khi xem xét lại.\n" +
                      "2. Cập nhật trạng thái `Violation` sang `DISMISSED`."
    )
    public ResponseEntity<?> dismissViolation(@PathVariable Integer violationId) {
        try { // Khối xử lý ngoại lệ khi hủy bỏ biên bản vi phạm
            refereeService.dismissViolation(violationId); // Gọi service hủy bỏ biên bản vi phạm
            return ResponseEntity.ok(Map.of("success", true, "message", "Violation dismissed.")); // Trả về HTTP 200 thông báo bác bỏ vi phạm thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu bác bỏ thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Trọng tài yêu cầu dừng thi đấu khẩn cấp cho một ngựa đua cụ thể
    @PostMapping("/entry/{entryId}/stop")
    @Operation(
        summary = "POST: Dừng thi đấu 1 con ngựa trong trận",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.stopEntry()`\n" +
                      "* **Services**: `RefereeService.stopEntry()`\n" +
                      "* **Repositories**: `RaceEntryRepository.save()`\n" +
                      "* **Entities**: `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RefereeSupervision.tsx`, `RefereeHub.tsx`, `refereeService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài ra lệnh dừng cho 1 chiến mã cụ thể theo `entryId`.\n" +
                      "2. Đổi trạng thái `RaceEntry` sang `STOPPED`."
    )
    public ResponseEntity<?> stopEntry(@PathVariable Integer entryId) {
        try { // Khối xử lý ngoại lệ khi dừng 1 ngựa đua cụ thể
            refereeService.stopEntry(entryId); // Gọi service dừng 1 chiến mã cụ thể trong trận
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has been stopped.")); // Trả về HTTP 200 thông báo dừng ngựa thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu dừng thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Cho phép ngựa đua đang bị dừng (STOPPED) quay trở lại tiếp tục chạy (RUNNING)
    @PostMapping("/entry/{entryId}/resume")
    @Operation(
        summary = "POST: Cho phép 1 con ngựa tiếp tục chạy",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.resumeEntry()`\n" +
                      "* **Services**: `RefereeService.resumeEntry()`\n" +
                      "* **Repositories**: `RaceEntryRepository.save()`\n" +
                      "* **Entities**: `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RefereeSupervision.tsx`, `RefereeHub.tsx`, `refereeService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài cho phép chiến mã tiếp tục thi đấu sau khi dừng.\n" +
                      "2. Đổi trạng thái `RaceEntry` về `RUNNING`."
    )
    public ResponseEntity<?> resumeEntry(@PathVariable Integer entryId) {
        try { // Khối xử lý ngoại lệ khi cho 1 ngựa đua chạy tiếp
            refereeService.resumeEntry(entryId); // Gọi service cho phép chiến mã tiếp tục chạy
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has resumed running.")); // Trả về HTTP 200 thông báo tiếp tục chạy thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu thao tác thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Truất quyền thi đấu (Disqualify) của một ngựa đua do vi phạm luật nghiêm trọng (Ví dụ: Cản đường trái phép)
    @PostMapping("/entry/{entryId}/disqualify")
    @Operation(
        summary = "POST: Truất quyền thi đấu (Disqualify) 1 con ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RefereeController.disqualifyEntry()`\n" +
                      "* **Services**: `RefereeService.disqualifyEntry()`\n" +
                      "* **Repositories**: `RaceEntryRepository.save()`\n" +
                      "* **Entities**: `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RefereeSupervision.tsx`, `RefereeHub.tsx`, `refereeService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Trọng tài truất quyền chiến mã theo `entryId` do vi phạm nghiêm trọng.\n" +
                      "2. Đổi trạng thái `RaceEntry` sang `DISQUALIFIED`."
    )
    public ResponseEntity<?> disqualifyEntry(@PathVariable Integer entryId) {
        try { // Khối xử lý ngoại lệ khi truất quyền thi đấu 1 ngựa đua
            refereeService.disqualifyEntry(entryId); // Gọi service truất quyền thi đấu của chiến mã
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has been disqualified.")); // Trả về HTTP 200 thông báo truất quyền thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu truất quyền thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }
}
