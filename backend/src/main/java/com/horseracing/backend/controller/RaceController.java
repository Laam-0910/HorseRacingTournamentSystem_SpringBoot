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
    name = "Race & Season Service",
    description = "🏛️ **Cấu trúc Mô-đun Quản lý Đua Ngựa & Mùa Giải (Race Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `RaceController.java`, `RaceDayScheduleController.java`\n" +
                  "* **Services**: `RaceService.java` (`RaceServiceImpl.java`), `SeasonService.java` (`SeasonServiceImpl.java`)\n" +
                  "* **Repositories**: `RaceRepository.java`, `RaceMeetingRepository.java`, `RaceEntryRepository.java`, `SeasonRepository.java`, `SeasonClassRuleRepository.java`\n" +
                  "* **Entities**: `Race.java`, `RaceMeeting.java`, `RaceEntry.java`, `Season.java`, `SeasonClassRule.java`\n" +
                  "* **DTOs**: `RaceDTO.java`, `RaceMeetingDTO.java`, `SeasonDTO.java`, `SeasonClassRuleDTO.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Admin khởi tạo **Mùa giải (`Season`)** và thiết lập **Quy tắc phân hạng Rating (`SeasonClassRule`)**.\n" +
                  "2. Tạo các **Ngày đua (`RaceMeeting`)** và chia nhỏ thành các **Trận đua (`Race`)** theo từng cự ly (1000m, 1200m, 1600m...).\n" +
                  "3. Mở cổng đăng ký thi đấu -> Tiếp nhận Ngựa & Nài -> Tự động sắp xếp **Cổng xuất phát (Gate)** và tính toán **Tạ gánh chì (Handicap Weight)**.\n" +
                  "4. Trọng tài khởi tranh trận đua (`RUNNING`) -> Ghi nhận kết quả cán đích -> Chốt kết quả chính thức (`OFFICIAL`).\n" +
                  "5. Tự động tính toán chia **Tiền thưởng (`Prize Money`)** và cập nhật **Điểm phong độ Elo Rating (`Current Rating`)** cho từng chiến mã."
)
public class RaceController {

    private final RaceService raceService;
    private final SeasonService seasonService;

    @GetMapping("/seasons")
    @Operation(summary = "Lấy danh sách các mùa giải", description = "📌 **Code Architecture**: `RaceController.getSeasons()` -> `SeasonService.getAllSeasons()` -> `SeasonRepository.findAll()` -> Trả về `List<SeasonDTO>`")
    public ResponseEntity<List<SeasonDTO>> getSeasons() {
        return ResponseEntity.ok(seasonService.getAllSeasons());
    }

    @PostMapping("/seasons")
    @Operation(summary = "Tạo mùa giải đua mới", description = "📌 **Code Architecture**: `RaceController.createSeason()` -> `SeasonService.createSeason()` -> Lưu `Season` Entity vào Database")
    public ResponseEntity<?> createSeason(@RequestBody Map<String, Object> body) {
        try {
            SeasonDTO season = seasonService.createSeason(body);
            return ResponseEntity.ok(Map.of("success", true, "season", season));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/seasons/{id}/toggle")
    @Operation(summary = "Bật/Kích hoạt trạng thái mùa giải", description = "📌 **Code Architecture**: `RaceController.toggleSeasonStatus()` -> `SeasonService.toggleSeasonStatus()` -> Cập nhật trạng thái `ACTIVE/COMPLETED`")
    public ResponseEntity<?> toggleSeasonStatus(@PathVariable Integer id) {
        try {
            String status = seasonService.toggleSeasonStatus(id);
            return ResponseEntity.ok(Map.of("success", true, "status", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/seasons/{id}/extend")
    @Operation(summary = "Gia hạn thời gian mùa giải", description = "📌 **Code Architecture**: `RaceController.extendSeason()` -> `SeasonService.extendSeason()` -> Cập nhật `startDate` & `endDate` của `Season`")
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
    @Operation(summary = "Lấy danh sách quy định phân hạng mùa giải", description = "📌 **Code Architecture**: `RaceController.getSeasonRules()` -> `SeasonService.getSeasonRules()` -> Lấy quy định `SeasonClassRule` theo `seasonId`")
    public ResponseEntity<List<SeasonClassRuleDTO>> getSeasonRules(@PathVariable Integer seasonId) {
        return ResponseEntity.ok(seasonService.getSeasonRules(seasonId));
    }

    @PostMapping("/seasons/{seasonId}/rules")
    @Operation(summary = "Lưu quy định phân hạng mùa giải", description = "📌 **Code Architecture**: `RaceController.saveSeasonRules()` -> `SeasonService.saveSeasonRules()` -> Lưu khoảng Rating (min/max rating) cho từng Class")
    public ResponseEntity<?> saveSeasonRules(@PathVariable Integer seasonId, @RequestBody List<SeasonClassRuleDTO> rules) {
        try {
            seasonService.saveSeasonRules(seasonId, rules);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/meetings")
    @Operation(summary = "Lấy danh sách Ngày đua (Race Meetings)", description = "📌 **Code Architecture**: `RaceController.getMeetings()` -> `RaceService.getAllMeetings()` -> `RaceMeetingRepository.findAll()`")
    public ResponseEntity<List<RaceMeetingDTO>> getMeetings() {
        return ResponseEntity.ok(raceService.getAllMeetings());
    }

    @PostMapping("/meetings")
    @Operation(summary = "Tạo mới Ngày đua (Race Meeting)", description = "📌 **Code Architecture**: `RaceController.createMeeting()` -> `RaceService.createMeeting()` -> Lưu `RaceMeeting` Entity")
    public ResponseEntity<?> createMeeting(@RequestBody RaceMeetingDTO meetingDTO) {
        try {
            RaceMeetingDTO savedMeeting = raceService.createMeeting(meetingDTO);
            return ResponseEntity.ok(Map.of("success", true, "meeting", savedMeeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/meetings/{id}")
    @Operation(summary = "Cập nhật Ngày đua", description = "📌 **Code Architecture**: `RaceController.updateMeeting()` -> `RaceService.updateMeeting()` -> Sửa thông tin Ngày đua")
    public ResponseEntity<?> updateMeeting(@PathVariable Integer id, @RequestBody RaceMeetingDTO meetingDTO) {
        try {
            RaceMeetingDTO updated = raceService.updateMeeting(id, meetingDTO);
            return ResponseEntity.ok(Map.of("success", true, "meeting", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/meetings/{id}")
    @Operation(summary = "Xóa Ngày đua", description = "📌 **Code Architecture**: `RaceController.deleteMeeting()` -> `RaceService.deleteMeeting()` -> Xóa Ngày đua khỏi DB")
    public ResponseEntity<?> deleteMeeting(@PathVariable Integer id) {
        try {
            raceService.deleteMeeting(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race Meeting deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả các trận đua (Races)", description = "📌 **Code Architecture**: `RaceController.getRaces()` -> `RaceService.getAllRaces()` -> `RaceRepository.findAll()`")
    public ResponseEntity<List<RaceDTO>> getRaces() {
        return ResponseEntity.ok(raceService.getAllRaces());
    }

    @PostMapping
    @Operation(summary = "Tạo mới trận đua (Race)", description = "📌 **Code Architecture**: `RaceController.createRace()` -> `RaceService.createRace()` -> Khởi tạo trận đua mới")
    public ResponseEntity<?> createRace(@RequestBody RaceDTO raceDTO) {
        try {
            RaceDTO savedRace = raceService.createRace(raceDTO);
            return ResponseEntity.ok(Map.of("success", true, "race", savedRace));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin trận đua", description = "📌 **Code Architecture**: `RaceController.updateRace()` -> `RaceService.updateRace()` -> Cập nhật thời gian, status, cự ly")
    public ResponseEntity<?> updateRace(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            RaceDTO updated = raceService.updateRace(id, body);
            return ResponseEntity.ok(Map.of("success", true, "race", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/live")
    @Operation(summary = "Lấy danh sách các trận đua đang diễn ra trực tiếp (Live)", description = "📌 **Code Architecture**: `RaceController.getLiveRaces()` -> `RaceService.getLiveRaces()` -> Trả về danh sách trận đang `RUNNING`")
    public ResponseEntity<List<RaceDTO>> getLiveRaces() {
        return ResponseEntity.ok(raceService.getLiveRaces());
    }
}
