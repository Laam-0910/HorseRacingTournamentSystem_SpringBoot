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

@RestController
@RequestMapping("/api/races")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(
    name = "05. Race Management Service",
    description = "🏁 **BƯỚC 5: QUẢN LÝ TRẬN ĐUA & THỜI GIAN (RACE ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `RaceController.java`\n" +
                  "* **Services**: `RaceService.java` (`RaceServiceImpl.java`), `SeasonService.java` (`SeasonServiceImpl.java`)\n" +
                  "* **Repositories**: `RaceRepository.java`, `RaceMeetingRepository.java`, `SeasonRepository.java`\n" +
                  "* **Entities**: `Race.java`, `RaceMeeting.java`, `Season.java`\n" +
                  "* **DTOs**: `RaceDTO.java`, `RaceMeetingDTO.java`, `SeasonDTO.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Tạo các **Trận đua (`Race`)** trong từng Ngày đua theo phân hạng Class 1 - Class 5 và Cự ly (1000m - 2400m).\n" +
                  "2. Cập nhật thông tin thời gian khởi tranh, link Livestream, trạng thái trận (`SCHEDULED`, `RUNNING`, `OFFICIAL`)."
)
public class RaceController {

    private final RaceService raceService;
    private final SeasonService seasonService;

    @GetMapping("/seasons")
    @Operation(
        summary = "GET: Lấy danh sách các mùa giải",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> 'Execute' để lấy danh sách Mùa giải.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.getSeasons()`\n" +
                      "* **Service**: `SeasonService.getAllSeasons()` (`SeasonServiceImpl.java`)\n" +
                      "* **Repository**: `SeasonRepository.findAll()`\n" +
                      "* **Entity**: `Season.java`\n" +
                      "* **DTO Response**: `List<SeasonDTO>`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Tiếp nhận request tra cứu danh sách mùa giải.\n" +
                      "2. Truy vấn toàn bộ danh sách `Season` trong MSSQL Database.\n" +
                      "3. Chuyển đổi dữ liệu sang `List<SeasonDTO>` và trả về cho Client."
    )
    public ResponseEntity<List<SeasonDTO>> getSeasons() {
        return ResponseEntity.ok(seasonService.getAllSeasons());
    }

    @PostMapping("/seasons")
    @Operation(
        summary = "POST: Tạo mùa giải đua mới",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.createSeason()`\n" +
                      "* **Service**: `SeasonService.createSeason()` (`SeasonServiceImpl.java`)\n" +
                      "* **Repository**: `SeasonRepository.save()`\n" +
                      "* **Entity**: `Season.java`\n" +
                      "* **DTO Request**: `Map<String, Object>` (`name`, `startDate`, `endDate`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"season\": SeasonDTO}`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận dữ liệu khởi tạo mùa giải (Tên mùa, Ngày bắt đầu, Ngày kết thúc).\n" +
                      "2. Kiểm tra trùng tên mùa giải và tính hợp lệ của khoảng thời gian.\n" +
                      "3. Lưu đối tượng `Season` mới vào cơ sở dữ liệu ở trạng thái `SCHEDULED`."
    )
    public ResponseEntity<?> createSeason(@RequestBody Map<String, Object> body) {
        try {
            SeasonDTO season = seasonService.createSeason(body);
            return ResponseEntity.ok(Map.of("success", true, "season", season));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/seasons/{id}/toggle")
    @Operation(
        summary = "POST: Bật/Kích hoạt trạng thái mùa giải",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.toggleSeasonStatus()`\n" +
                      "* **Service**: `SeasonService.toggleSeasonStatus()` (`SeasonServiceImpl.java`)\n" +
                      "* **Repository**: `SeasonRepository.save()`\n" +
                      "* **Entity**: `Season.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tìm kiếm `Season` theo ID truyền vào.\n" +
                      "2. Chuyển đổi trạng thái hoạt động giữa `ACTIVE` và `COMPLETED`.\n" +
                      "3. Cập nhật bản ghi trong cơ sở dữ liệu."
    )
    public ResponseEntity<?> toggleSeasonStatus(@PathVariable Integer id) {
        try {
            String status = seasonService.toggleSeasonStatus(id);
            return ResponseEntity.ok(Map.of("success", true, "status", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/seasons/{id}/extend")
    @Operation(
        summary = "POST: Gia hạn thời gian mùa giải",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.extendSeason()`\n" +
                      "* **Service**: `SeasonService.extendSeason()` (`SeasonServiceImpl.java`)\n" +
                      "* **Repository**: `SeasonRepository.save()`\n" +
                      "* **Entity**: `Season.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận ngày bắt đầu/kết thúc mới cho Mùa giải.\n" +
                      "2. Cập nhật thời hạn `startDate` và `endDate` trong bản ghi `Season`."
    )
    public ResponseEntity<?> extendSeason(@PathVariable Integer id, @RequestBody Map<String, String> body) {
        try {
            String newStartDate = body.get("startDate");
            String newEndDate = body.get("endDate");
            SeasonDTO updated = seasonService.extendSeason(id, newStartDate, newEndDate);
            return ResponseEntity.ok(Map.of("success", true, "season", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/seasons/{seasonId}/rules")
    @Operation(
        summary = "GET: Lấy quy định phân hạng mùa giải",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> Điền seasonId -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.getSeasonRules()`\n" +
                      "* **Service**: `SeasonService.getSeasonRules()` (`SeasonServiceImpl.java`)\n" +
                      "* **Repository**: `SeasonClassRuleRepository.findBySeasonId()`\n" +
                      "* **Entity**: `SeasonClassRule.java`\n" +
                      "* **DTO Response**: `List<SeasonClassRuleDTO>`"
    )
    public ResponseEntity<List<SeasonClassRuleDTO>> getSeasonRules(@PathVariable Integer seasonId) {
        return ResponseEntity.ok(seasonService.getSeasonRules(seasonId));
    }

    @PostMapping("/seasons/{seasonId}/rules")
    @Operation(
        summary = "POST: Lưu quy định phân hạng mùa giải",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.saveSeasonRules()`\n" +
                      "* **Service**: `SeasonService.saveSeasonRules()` (`SeasonServiceImpl.java`)\n" +
                      "* **Repository**: `SeasonClassRuleRepository.saveAll()`\n" +
                      "* **Entity**: `SeasonClassRule.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận danh sách quy định phân hạng theo điểm Rating (Min/Max Rating cho Class 1 - Class 5).\n" +
                      "2. Ghi đè hoặc cập nhật các quy định phân hạng `SeasonClassRule` vào cơ sở dữ liệu."
    )
    public ResponseEntity<?> saveSeasonRules(@PathVariable Integer seasonId, @RequestBody List<SeasonClassRuleDTO> rules) {
        try {
            seasonService.saveSeasonRules(seasonId, rules);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/meetings")
    @Operation(
        summary = "GET: Lấy danh sách Ngày đua (Race Meetings)",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.getMeetings()`\n" +
                      "* **Service**: `RaceService.getAllMeetings()` (`RaceServiceImpl.java`)\n" +
                      "* **Repository**: `RaceMeetingRepository.findAll()`\n" +
                      "* **Entity**: `RaceMeeting.java`\n" +
                      "* **DTO Response**: `List<RaceMeetingDTO>`"
    )
    public ResponseEntity<List<RaceMeetingDTO>> getMeetings() {
        return ResponseEntity.ok(raceService.getAllMeetings());
    }

    @PostMapping("/meetings")
    @Operation(
        summary = "POST: Tạo mới Ngày đua (Race Meeting)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.createMeeting()`\n" +
                      "* **Service**: `RaceService.createMeeting()` (`RaceServiceImpl.java`)\n" +
                      "* **Repository**: `RaceMeetingRepository.save()`\n" +
                      "* **Entity**: `RaceMeeting.java`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Khởi tạo đối tượng Ngày đua (`RaceMeeting`) gồm Tên ngày đua, Địa điểm, Thời gian.\n" +
                      "2. Lưu vào DB để chuẩn bị sắp xếp các trận đua chi tiết bên trong."
    )
    public ResponseEntity<?> createMeeting(@RequestBody RaceMeetingDTO meetingDTO) {
        try {
            RaceMeetingDTO savedMeeting = raceService.createMeeting(meetingDTO);
            return ResponseEntity.ok(Map.of("success", true, "meeting", savedMeeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/meetings/{id}")
    @Operation(
        summary = "POST: Cập nhật Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.updateMeeting()`\n" +
                      "* **Service**: `RaceService.updateMeeting()` (`RaceServiceImpl.java`)\n" +
                      "* **Repository**: `RaceMeetingRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tìm `RaceMeeting` theo ID và cập nhật thông tin tên ngày đua, địa điểm hoặc trạng thái."
    )
    public ResponseEntity<?> updateMeeting(@PathVariable Integer id, @RequestBody RaceMeetingDTO meetingDTO) {
        try {
            RaceMeetingDTO updated = raceService.updateMeeting(id, meetingDTO);
            return ResponseEntity.ok(Map.of("success", true, "meeting", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/meetings/{id}")
    @Operation(
        summary = "DELETE: Xóa Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ DELETE API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.deleteMeeting()`\n" +
                      "* **Service**: `RaceService.deleteMeeting()` (`RaceServiceImpl.java`)\n" +
                      "* **Repository**: `RaceMeetingRepository.deleteById()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra Ngày đua có chứa các trận đua đang diễn ra không.\n" +
                      "2. Xóa bản ghi `RaceMeeting` khỏi cơ sở dữ liệu nếu hợp lệ."
    )
    public ResponseEntity<?> deleteMeeting(@PathVariable Integer id) {
        try {
            raceService.deleteMeeting(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race Meeting deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping
    @Operation(
        summary = "GET: Lấy danh sách tất cả các trận đua (Races)",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> 'Execute' để xem danh sách Trận đua.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.getRaces()`\n" +
                      "* **Service**: `RaceService.getAllRaces()` (`RaceServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRepository.findAll()`\n" +
                      "* **Entity**: `Race.java`\n" +
                      "* **DTO Response**: `List<RaceDTO>`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Truy vấn danh sách toàn bộ các Trận đua (`Race`) có trong cơ sở dữ liệu.\n" +
                      "2. Chuyển đổi thành `List<RaceDTO>` chứa thông tin cự ly, hạng đua, thời gian khởi tranh."
    )
    public ResponseEntity<List<RaceDTO>> getRaces() {
        return ResponseEntity.ok(raceService.getAllRaces());
    }

    @PostMapping
    @Operation(
        summary = "POST: Tạo mới trận đua (Race)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.createRace()`\n" +
                      "* **Service**: `RaceService.createRace()` (`RaceServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRepository.save()`\n" +
                      "* **Entity**: `Race.java`\n" +
                      "* **DTO Request**: `RaceDTO` (`raceMeetingId`, `name`, `distance`, `classLevel`, `startTime`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"race\": RaceDTO}`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Khởi tạo Trận đua mới thuộc một Ngày đua (`RaceMeeting`).\n" +
                      "2. Thiết lập cự ly chạy (1000m, 1200m, 1600m...), hạng đua (Class 1-5) và giờ xuất phát.\n" +
                      "3. Lưu đối tượng `Race` vào cơ sở dữ liệu ở trạng thái `SCHEDULED`."
    )
    public ResponseEntity<?> createRace(@RequestBody RaceDTO raceDTO) {
        try {
            RaceDTO savedRace = raceService.createRace(raceDTO);
            return ResponseEntity.ok(Map.of("success", true, "race", savedRace));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}")
    @Operation(
        summary = "POST: Cập nhật thông tin trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.updateRace()`\n" +
                      "* **Service**: `RaceService.updateRace()` (`RaceServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRepository.save()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Cập nhật các trường thông tin cự ly, thời gian, trạng thái hoặc link Livestream cho trận đua."
    )
    public ResponseEntity<?> updateRace(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            RaceDTO updated = raceService.updateRace(id, body);
            return ResponseEntity.ok(Map.of("success", true, "race", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/live")
    @Operation(
        summary = "GET: Lấy danh sách các trận đua đang trực tiếp (Live)",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceController.getLiveRaces()`\n" +
                      "* **Service**: `RaceService.getLiveRaces()` (`RaceServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRepository.findByStatus(\"RUNNING\")`\n" +
                      "* **DTO Response**: `List<RaceDTO>`"
    )
    public ResponseEntity<List<RaceDTO>> getLiveRaces() {
        return ResponseEntity.ok(raceService.getLiveRaces());
    }
}
