package com.horseracing.backend.controller;

import com.horseracing.backend.dto.RaceDTO;
import com.horseracing.backend.dto.RaceMeetingDTO;
import com.horseracing.backend.dto.SeasonClassRuleDTO;
import com.horseracing.backend.dto.SeasonDTO;
import com.horseracing.backend.service.RaceService;
import com.horseracing.backend.service.SeasonService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller RaceController - Lớp kiểm soát các endpoint liên quan đến Mùa giải, Ngày hội đua và các Trận đua.
 * - Quản lý mùa giải (Tạo mùa giải mới, Bật/Tắt kích hoạt, Gia hạn thời gian, Xem/Sửa quy định phân hạng điểm).
 * - Quản lý Ngày hội đua (CRUD ngày hội đua - Race Meetings).
 * - Quản lý Trận đua (Xem danh sách, Tạo mới trận đua Class 1-5, Cập nhật thông số cự ly/thời gian/link live).
 * - Lấy danh sách các trận đua đang phát trực tiếp (Live races).
 */
@RestController
@RequestMapping("/api/races")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
public class RaceController {

    private final RaceService raceService; // Dịch vụ quản lý giải đua, trận đua
    private final SeasonService seasonService; // Dịch vụ quản lý mùa giải

    // Lấy toàn bộ danh sách các mùa giải đua
    @GetMapping("/seasons")
        public ResponseEntity<List<SeasonDTO>> getSeasons() {
        return ResponseEntity.ok(seasonService.getAllSeasons()); // Trả về danh sách tất cả các mùa giải đua
    }

    // Tạo mùa giải đua mới
    @PostMapping("/seasons")
        public ResponseEntity<?> createSeason(@RequestBody Map<String, Object> body) {
        try { // Khối xử lý ngoại lệ khi tạo mới mùa giải
            SeasonDTO season = seasonService.createSeason(body); // Gọi service tạo mùa giải mới từ dữ liệu truyền vào
            return ResponseEntity.ok(Map.of("success", true, "season", season)); // Trả về HTTP 200 kèm DTO mùa giải vừa khởi tạo thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu tạo mùa giải thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Đảo trạng thái hoạt động của mùa giải đua (Active / Completed)
    @PostMapping("/seasons/{id}/toggle")
        public ResponseEntity<?> toggleSeasonStatus(@PathVariable Integer id) {
        try { // Khối xử lý ngoại lệ khi thay đổi trạng thái mùa giải
            String status = seasonService.toggleSeasonStatus(id); // Gọi service đảo trạng thái mùa giải theo ID
            return ResponseEntity.ok(Map.of("success", true, "status", status)); // Trả về HTTP 200 kèm trạng thái mới của mùa giải
        } catch (Exception e) { // Bắt ngoại lệ nếu thay đổi trạng thái thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Gia hạn khoảng thời gian tổ chức của một mùa giải đua
    @PostMapping("/seasons/{id}/extend")
        public ResponseEntity<?> extendSeason(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try { // Khối xử lý ngoại lệ khi gia hạn thời gian mùa giải
            String newStartDate = body.get("startDate"); // Trích xuất ngày bắt đầu mới từ body
            String newEndDate = body.get("endDate"); // Trích xuất ngày kết thúc mới từ body
            SeasonDTO updated = seasonService.extendSeason(id, newStartDate, newEndDate); // Gọi service cập nhật thời hạn mùa giải
            return ResponseEntity.ok(Map.of("success", true, "season", updated)); // Trả về HTTP 200 kèm DTO mùa giải đã gia hạn
        } catch (Exception e) { // Bắt ngoại lệ nếu gia hạn thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Xem quy định phân hạng điểm Rating của mùa giải
    @GetMapping("/seasons/{seasonId}/rules")
        public ResponseEntity<List<SeasonClassRuleDTO>> getSeasonRules(@PathVariable Integer seasonId) {
        return ResponseEntity.ok(seasonService.getSeasonRules(seasonId)); // Trả về danh sách quy định phân hạng điểm Rating của mùa giải
    }

    // Ghi đè hoặc lưu mới danh sách các quy định phân hạng điểm Rating cho mùa giải
    @PostMapping("/seasons/{seasonId}/rules")
        public ResponseEntity<?> saveSeasonRules(@PathVariable Integer seasonId, @RequestBody List<SeasonClassRuleDTO> rules) {
        try { // Khối xử lý ngoại lệ khi lưu quy định phân hạng mùa giải
            seasonService.saveSeasonRules(seasonId, rules); // Gọi service ghi đè/lưu mới danh sách quy định phân hạng
            return ResponseEntity.ok(Map.of("success", true)); // Trả về HTTP 200 thông báo lưu thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu lưu quy định phân hạng thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Lấy toàn bộ danh sách Ngày hội đua (Meetings)
    @GetMapping("/meetings")
        public ResponseEntity<List<RaceMeetingDTO>> getMeetings() {
        return ResponseEntity.ok(raceService.getAllMeetings()); // Trả về danh sách tất cả các Ngày hội đua
    }

    // Tạo mới một Ngày hội đua (Chỉ dành cho Admin thiết lập lịch)
    @PostMapping("/meetings")
        public ResponseEntity<?> createMeeting(@RequestBody RaceMeetingDTO meetingDTO) {
        try { // Khối xử lý ngoại lệ khi tạo Ngày hội đua mới
            RaceMeetingDTO savedMeeting = raceService.createMeeting(meetingDTO); // Gọi service lưu thông tin Ngày hội đua mới
            return ResponseEntity.ok(Map.of("success", true, "meeting", savedMeeting)); // Trả về HTTP 200 kèm DTO Ngày hội đua vừa khởi tạo
        } catch (Exception e) { // Bắt ngoại lệ nếu tạo Ngày hội đua thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Cập nhật thông tin chi tiết của một Ngày hội đua
    @PostMapping("/meetings/{id}")
        public ResponseEntity<?> updateMeeting(@PathVariable Integer id, @RequestBody RaceMeetingDTO meetingDTO) {
        try { // Khối xử lý ngoại lệ khi cập nhật Ngày hội đua
            RaceMeetingDTO updated = raceService.updateMeeting(id, meetingDTO); // Gọi service cập nhật thông tin Ngày hội đua
            return ResponseEntity.ok(Map.of("success", true, "meeting", updated)); // Trả về HTTP 200 kèm DTO Ngày hội đua sau khi cập nhật
        } catch (Exception e) { // Bắt ngoại lệ nếu cập nhật thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Xóa Ngày hội đua khỏi hệ thống
    @DeleteMapping("/meetings/{id}")
        public ResponseEntity<?> deleteMeeting(@PathVariable Integer id) {
        try { // Khối xử lý ngoại lệ khi xóa Ngày hội đua
            raceService.deleteMeeting(id); // Gọi service xóa Ngày hội đua theo ID
            return ResponseEntity.ok(Map.of("success", true, "message", "Race Meeting deleted successfully.")); // Trả về HTTP 200 thông báo xóa thành công
        } catch (Exception e) { // Bắt ngoại lệ nếu xóa thất bại
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Lấy toàn bộ danh sách trận đua có trong hệ thống
    @GetMapping
        public ResponseEntity<List<RaceDTO>> getRaces() {
        return ResponseEntity.ok(raceService.getAllRaces()); // Trả về danh sách tất cả các trận đua
    }

    // Tạo mới một trận đua trực thuộc một Ngày hội đua
    @PostMapping
        public ResponseEntity<?> createRace(@RequestBody RaceDTO raceDTO) {
        try { // Khối xử lý ngoại lệ khi tạo trận đua mới
            RaceDTO savedRace = raceService.createRace(raceDTO); // Gọi service lưu thông tin trận đua mới
            return ResponseEntity.ok(Map.of("success", true, "race", savedRace)); // Trả về HTTP 200 kèm DTO trận đua vừa khởi tạo
        } catch (IllegalArgumentException e) { // Bắt ngoại lệ tham số không hợp lệ
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Cập nhật chi tiết thông tin trận đua (Thời gian, cự ly, link stream, trạng thái...)
    @PostMapping("/{id}")
        public ResponseEntity<?> updateRace(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try { // Khối xử lý ngoại lệ khi cập nhật trận đua
            RaceDTO updated = raceService.updateRace(id, body); // Gọi service cập nhật thông tin chi tiết của trận đua
            return ResponseEntity.ok(Map.of("success", true, "race", updated)); // Trả về HTTP 200 kèm DTO trận đua sau khi cập nhật
        } catch (IllegalArgumentException e) { // Bắt ngoại lệ tham số không hợp lệ
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }

    // Tra cứu danh sách các trận đua đang phát trực tiếp (Đang chạy - RUNNING)
    @GetMapping("/live")
        public ResponseEntity<List<RaceDTO>> getLiveRaces() {
        return ResponseEntity.ok(raceService.getLiveRaces()); // Trả về danh sách các trận đua đang được phát trực tiếp
    }
}
