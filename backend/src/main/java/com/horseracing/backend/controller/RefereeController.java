package com.horseracing.backend.controller;

import com.horseracing.backend.dto.ViolationDTO;
import com.horseracing.backend.service.ProcessResultsService;
import com.horseracing.backend.service.RefereeService;
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
public class RefereeController {

    private final RefereeService refereeService; // Dịch vụ trọng tài điều khiển đường đua
    private final ProcessResultsService processResultsService; // Dịch vụ xử lý kết quả cuộc đua

    // Thực hiện kiểm tra thông số cân nặng thực tế và sức khỏe của chiến mã trước giờ xuất phát
    @PostMapping("/pre-check")
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
        public ResponseEntity<Map<String, Object>> getRefereeDashboard(@PathVariable Integer id) {
        return ResponseEntity.ok(refereeService.getRefereeDashboard(id)); // Trả về thông tin thống kê Dashboard của trọng tài theo ID
    }

    // Phát lệnh xuất phát trận đua (Đổi trạng thái từ SCHEDULED sang RUNNING)
    @PostMapping("/races/{raceId}/start")
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
        public ResponseEntity<?> disqualifyEntry(@PathVariable Integer entryId) {
        try { // Khối xử lý ngoại lệ khi truất quyền thi đấu 1 ngựa đua
            refereeService.disqualifyEntry(entryId); // Gọi service truất quyền thi đấu của chiến mã
            return ResponseEntity.ok(Map.of("success", true, "message", "Horse has been disqualified.")); // Trả về HTTP 200 thông báo truất quyền thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu truất quyền thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }
}
