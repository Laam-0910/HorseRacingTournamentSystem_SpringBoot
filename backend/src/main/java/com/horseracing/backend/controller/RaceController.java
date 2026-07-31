package com.horseracing.backend.controller;

import com.horseracing.backend.dto.RaceDTO;
import com.horseracing.backend.dto.RaceMeetingDTO;
import com.horseracing.backend.dto.SeasonClassRuleDTO;
import com.horseracing.backend.dto.SeasonDTO;
import com.horseracing.backend.service.RaceService;
import com.horseracing.backend.service.SeasonService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(
    name = "05. Race Management Service",
    description = "🏁 **BƯỚC 5: QUẢN LÝ TRẬN ĐUA & THỜI GIAN (RACE ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `RaceController.java`\n" +
                  "* **Services**: `RaceService.java`, `SeasonService.java`\n" +
                  "* **Repositories**: `RaceRepository.java`, `RaceMeetingRepository.java`, `SeasonRepository.java`\n" +
                  "* **Entities**: `Race.java`, `RaceMeeting.java`, `Season.java`\n" +
                  "* **DTOs**: `RaceDTO.java`, `RaceMeetingDTO.java`, `SeasonDTO.java`\n" +
                  "* **Frontend**: `Race.tsx` (admin-workflow), `Racecard.tsx`, `LiveSettings.tsx`, `Results.tsx`, `Season.tsx`\n" +
                  "* **Scheduler**: `RaceStatusScheduler.java` (Tự động hủy trận nếu < 3 ngựa đăng ký)\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Tạo các **Trận đua (`Race`)** trong từng Ngày đua theo phân hạng Class 1 - Class 5 và Cự ly (1000m - 2400m).\n" +
                  "2. Cập nhật thông tin thời gian khởi tranh, link Livestream, trạng thái trận (`SCHEDULED`, `RUNNING`, `OFFICIAL`).\n" +
                  "3. **Tự động hủy (`CANCELLED`)**: `RaceStatusScheduler` chạy định kỳ, kiểm tra trận nào chốt sổ nhưng < 3 ngựa được duyệt sẽ tự động hủy."
)
public class RaceController {

    private final RaceService raceService; // Dịch vụ quản lý giải đua, trận đua
    private final SeasonService seasonService; // Dịch vụ quản lý mùa giải

    // Lấy toàn bộ danh sách các mùa giải đua
    @GetMapping("/seasons")
    @Operation(
        summary = "GET: Lấy danh sách các mùa giải",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.getSeasons()`\n" +
                      "* **Services**: `SeasonService.getAllSeasons()`\n" +
                      "* **Repositories**: `SeasonRepository.findAll()`\n" +
                      "* **Entities**: `Season.java`\n" +
                      "* **DTOs**: `SeasonDTO`\n" +
                      "* **DTO Response**: `List<SeasonDTO>`\n" +
                      "* **Frontend**: `Season.tsx` (admin-workflow), `raceService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tiếp nhận request tra cứu danh sách mùa giải.\n" +
                      "2. Truy vấn toàn bộ danh sách `Season` trong MSSQL Database.\n" +
                      "3. Chuyển đổi dữ liệu sang `List<SeasonDTO>` và trả về cho Client."
    )
    public ResponseEntity<List<SeasonDTO>> getSeasons() {
        return ResponseEntity.ok(seasonService.getAllSeasons()); // Trả về danh sách tất cả các mùa giải đua
    }

    // Tạo mùa giải đua mới
    @PostMapping("/seasons")
    @Operation(
        summary = "POST: Tạo mùa giải đua mới",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.createSeason()`\n" +
                      "* **Services**: `SeasonService.createSeason()`\n" +
                      "* **Repositories**: `SeasonRepository.save()`\n" +
                      "* **Entities**: `Season.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`name`, `startDate`, `endDate`), `SeasonDTO`\n" +
                      "* **DTO Request**: `Map<String, Object>` (`name`, `startDate`, `endDate`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"season\": SeasonDTO}`)\n" +
                      "* **Frontend**: `Season.tsx` (admin-workflow), `raceService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận dữ liệu khởi tạo mùa giải (Tên mùa, Ngày bắt đầu, Ngày kết thúc).\n" +
                      "2. Kiểm tra trùng tên mùa giải và tính hợp lệ của khoảng thời gian.\n" +
                      "3. Lưu đối tượng `Season` mới vào cơ sở dữ liệu ở trạng thái `SCHEDULED`."
    )
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
    @Operation(
        summary = "POST: Bật/Kích hoạt trạng thái mùa giải",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.toggleSeasonStatus()`\n" +
                      "* **Services**: `SeasonService.toggleSeasonStatus()`\n" +
                      "* **Repositories**: `SeasonRepository.save()`\n" +
                      "* **Entities**: `Season.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"status\": \"ACTIVE/COMPLETED\"}`)\n" +
                      "* **Frontend**: `Season.tsx` (admin-workflow), `raceService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tìm kiếm `Season` theo ID truyền vào.\n" +
                      "2. Chuyển đổi trạng thái hoạt động giữa `ACTIVE` và `COMPLETED`.\n" +
                      "3. Cập nhật bản ghi trong cơ sở dữ liệu."
    )
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
    @Operation(
        summary = "POST: Gia hạn thời gian mùa giải",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.extendSeason()`\n" +
                      "* **Services**: `SeasonService.extendSeason()`\n" +
                      "* **Repositories**: `SeasonRepository.save()`\n" +
                      "* **Entities**: `Season.java`\n" +
                      "* **DTOs**: `Map<String, String>` (`startDate`, `endDate`), `SeasonDTO`\n" +
                      "* **DTO Request**: `Map<String, String>` (`startDate`, `endDate`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"season\": SeasonDTO}`)\n" +
                      "* **Frontend**: `Season.tsx` (admin-workflow), `raceService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận ngày bắt đầu/kết thúc mới cho Mùa giải.\n" +
                      "2. Cập nhật thời hạn `startDate` và `endDate` trong bản ghi `Season`."
    )
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
    @Operation(
        summary = "GET: Lấy quy định phân hạng mùa giải",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.getSeasonRules()`\n" +
                      "* **Services**: `SeasonService.getSeasonRules()`\n" +
                      "* **Repositories**: `SeasonClassRuleRepository.findBySeasonId()`\n" +
                      "* **Entities**: `SeasonClassRule.java`\n" +
                      "* **DTOs**: `SeasonClassRuleDTO`\n" +
                      "* **DTO Response**: `List<SeasonClassRuleDTO>`\n" +
                      "* **Frontend**: `SeasonRulesEdit.tsx` (admin-workflow), `raceService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tra cứu danh sách khung điểm Min/Max Rating của các Hạng đua Class 1 - Class 5 thuộc Mùa giải."
    )
    public ResponseEntity<List<SeasonClassRuleDTO>> getSeasonRules(@PathVariable Integer seasonId) {
        return ResponseEntity.ok(seasonService.getSeasonRules(seasonId)); // Trả về danh sách quy định phân hạng điểm Rating của mùa giải
    }

    // Ghi đè hoặc lưu mới danh sách các quy định phân hạng điểm Rating cho mùa giải
    @PostMapping("/seasons/{seasonId}/rules")
    @Operation(
        summary = "POST: Lưu quy định phân hạng mùa giải",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.saveSeasonRules()`\n" +
                      "* **Services**: `SeasonService.saveSeasonRules()`\n" +
                      "* **Repositories**: `SeasonClassRuleRepository.saveAll()`\n" +
                      "* **Entities**: `SeasonClassRule.java`\n" +
                      "* **DTOs**: `List<SeasonClassRuleDTO>`\n" +
                      "* **DTO Request**: `List<SeasonClassRuleDTO>` (`classLevel`, `minRating`, `maxRating`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `SeasonRulesEdit.tsx` (admin-workflow), `raceService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận danh sách quy định phân hạng theo điểm Rating (Min/Max Rating cho Class 1 - Class 5).\n" +
                      "2. Ghi đè hoặc cập nhật các quy định phân hạng `SeasonClassRule` vào cơ sở dữ liệu."
    )
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
    @Operation(
        summary = "GET: Lấy danh sách Ngày đua (Race Meetings)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.getMeetings()`\n" +
                      "* **Services**: `RaceService.getAllMeetings()`\n" +
                      "* **Repositories**: `RaceMeetingRepository.findAll()`\n" +
                      "* **Entities**: `RaceMeeting.java`\n" +
                      "* **DTOs**: `RaceMeetingDTO`\n" +
                      "* **DTO Response**: `List<RaceMeetingDTO>`\n" +
                      "* **Frontend**: `RaceDaySchedule.tsx`, `raceService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Truy vấn danh sách toàn bộ Ngày hội đua trong cơ sở dữ liệu."
    )
    public ResponseEntity<List<RaceMeetingDTO>> getMeetings() {
        return ResponseEntity.ok(raceService.getAllMeetings()); // Trả về danh sách tất cả các Ngày hội đua
    }

    // Tạo mới một Ngày hội đua (Chỉ dành cho Admin thiết lập lịch)
    @PostMapping("/meetings")
    @Operation(
        summary = "POST: Tạo mới Ngày đua (Race Meeting)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.createMeeting()`\n" +
                      "* **Services**: `RaceService.createMeeting()`\n" +
                      "* **Repositories**: `RaceMeetingRepository.save()`\n" +
                      "* **Entities**: `RaceMeeting.java`\n" +
                      "* **DTOs**: `RaceMeetingDTO`, `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Request**: `RaceMeetingDTO` (`name`, `location`, `meetingDate`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"meeting\": RaceMeetingDTO}`)\n" +
                      "* **Frontend**: `RaceDaySchedule.tsx`, `raceService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Khởi tạo đối tượng Ngày đua (`RaceMeeting`) gồm Tên ngày đua, Địa điểm, Thời gian.\n" +
                      "2. Lưu vào DB để chuẩn bị sắp xếp các trận đua chi tiết bên trong."
    )
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
    @Operation(
        summary = "POST: Cập nhật Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.updateMeeting()`\n" +
                      "* **Services**: `RaceService.updateMeeting()`\n" +
                      "* **Repositories**: `RaceMeetingRepository.save()`\n" +
                      "* **Entities**: `RaceMeeting.java`\n" +
                      "* **DTOs**: `RaceMeetingDTO`, `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Request**: `RaceMeetingDTO` (`name`, `location`, `meetingDate`, `status`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"meeting\": RaceMeetingDTO}`)\n" +
                      "* **Frontend**: `RaceDaySchedule.tsx`, `raceService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tìm `RaceMeeting` theo ID và cập nhật thông tin tên ngày đua, địa điểm hoặc trạng thái."
    )
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
    @Operation(
        summary = "DELETE: Xóa Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ DELETE API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.deleteMeeting()`\n" +
                      "* **Services**: `RaceService.deleteMeeting()`\n" +
                      "* **Repositories**: `RaceMeetingRepository.deleteById()`\n" +
                      "* **Entities**: `RaceMeeting.java`\n" +
                      "* **DTOs**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `RaceDaySchedule.tsx`, `raceService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra Ngày đua có chứa các trận đua đang diễn ra không.\n" +
                      "2. Xóa bản ghi `RaceMeeting` khỏi cơ sở dữ liệu nếu hợp lệ."
    )
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
    @Operation(
        summary = "GET: Lấy danh sách tất cả các trận đua (Races)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.getRaces()`\n" +
                      "* **Services**: `RaceService.getAllRaces()`\n" +
                      "* **Repositories**: `RaceRepository.findAll()`\n" +
                      "* **Entities**: `Race.java`\n" +
                      "* **DTOs**: `RaceDTO`\n" +
                      "* **DTO Response**: `List<RaceDTO>`\n" +
                      "* **Frontend**: `Race.tsx` (admin-workflow), `Racecard.tsx`, `raceService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Truy vấn danh sách toàn bộ các Trận đua (`Race`) có trong cơ sở dữ liệu.\n" +
                      "2. Chuyển đổi thành `List<RaceDTO>` chứa thông tin cự ly, hạng đua, thời gian khởi tranh."
    )
    public ResponseEntity<List<RaceDTO>> getRaces() {
        return ResponseEntity.ok(raceService.getAllRaces()); // Trả về danh sách tất cả các trận đua
    }

    // Tạo mới một trận đua trực thuộc một Ngày hội đua
    @PostMapping
    @Operation(
        summary = "POST: Tạo mới trận đua (Race)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.createRace()`\n" +
                      "* **Services**: `RaceService.createRace()`\n" +
                      "* **Repositories**: `RaceRepository.save()`\n" +
                      "* **Entities**: `Race.java`\n" +
                      "* **DTOs**: `RaceDTO` (`raceMeetingId`, `name`, `distance`, `classLevel`, `startTime`), `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Request**: `RaceDTO` (`raceMeetingId`, `name`, `distance`, `classLevel`, `startTime`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"race\": RaceDTO}`)\n" +
                      "* **Frontend**: `Race.tsx` (admin-workflow), `raceService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Khởi tạo Trận đua mới thuộc một Ngày đua (`RaceMeeting`).\n" +
                      "2. Thiết lập cự ly chạy (1000m, 1200m, 1600m...), hạng đua (Class 1-5) và giờ xuất phát.\n" +
                      "3. Lưu đối tượng `Race` vào cơ sở dữ liệu ở trạng thái `SCHEDULED`."
    )
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
    @Operation(
        summary = "POST: Cập nhật thông tin trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.updateRace()`\n" +
                      "* **Services**: `RaceService.updateRace()`\n" +
                      "* **Repositories**: `RaceRepository.save()`\n" +
                      "* **Entities**: `Race.java`\n" +
                      "* **DTOs**: `RaceDTO`, `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Request**: `Map<String, Object>` (`name`, `distance`, `classLevel`, `startTime`, `youtubeLiveUrl`, `status`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"race\": RaceDTO}`)\n" +
                      "* **Frontend**: `Race.tsx` (admin-workflow), `LiveSettings.tsx`, `raceService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Cập nhật các trường thông tin cự ly, thời gian, trạng thái hoặc link Livestream cho trận đua."
    )
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
    @Operation(
        summary = "GET: Lấy danh sách các trận đua đang trực tiếp (Live)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceController.getLiveRaces()`\n" +
                      "* **Services**: `RaceService.getLiveRaces()`\n" +
                      "* **Repositories**: `RaceRepository.findByStatus(\"RUNNING\")`\n" +
                      "* **Entities**: `Race.java`\n" +
                      "* **DTOs**: `RaceDTO`\n" +
                      "* **DTO Response**: `List<RaceDTO>`\n" +
                      "* **Frontend**: `LiveSettings.tsx`, `Spectator.tsx`, `raceService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Lấy tất cả trận đua có trạng thái `RUNNING` để phát trực tiếp."
    )
    public ResponseEntity<List<RaceDTO>> getLiveRaces() {
        return ResponseEntity.ok(raceService.getLiveRaces()); // Trả về danh sách các trận đua đang được phát trực tiếp
    }
}
