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
    @Operation(summary = "GET: Lấy danh sách các mùa giải", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute' để lấy danh sách Mùa giải.\n\n📌 **Code Architecture**: `RaceController.getSeasons()` -> `SeasonService.getAllSeasons()`")
    public ResponseEntity<List<SeasonDTO>> getSeasons() {
        return ResponseEntity.ok(seasonService.getAllSeasons());
    }

    @PostMapping("/seasons")
    @Operation(summary = "POST: Tạo mùa giải đua mới", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RaceController.createSeason()` -> `SeasonService.createSeason()`")
    public ResponseEntity<?> createSeason(@RequestBody Map<String, Object> body) {
        try {
            SeasonDTO season = seasonService.createSeason(body);
            return ResponseEntity.ok(Map.of("success", true, "season", season));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/seasons/{id}/toggle")
    @Operation(summary = "POST: Bật/Kích hoạt trạng thái mùa giải", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RaceController.toggleSeasonStatus()` -> `SeasonService.toggleSeasonStatus()`")
    public ResponseEntity<?> toggleSeasonStatus(@PathVariable Integer id) {
        try {
            String status = seasonService.toggleSeasonStatus(id);
            return ResponseEntity.ok(Map.of("success", true, "status", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/seasons/{id}/extend")
    @Operation(summary = "POST: Gia hạn thời gian mùa giải", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RaceController.extendSeason()` -> `SeasonService.extendSeason()`")
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
    @Operation(summary = "GET: Lấy quy định phân hạng mùa giải", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> Điền seasonId -> 'Execute'.\n\n📌 **Code Architecture**: `RaceController.getSeasonRules()` -> `SeasonService.getSeasonRules()`")
    public ResponseEntity<List<SeasonClassRuleDTO>> getSeasonRules(@PathVariable Integer seasonId) {
        return ResponseEntity.ok(seasonService.getSeasonRules(seasonId));
    }

    @PostMapping("/seasons/{seasonId}/rules")
    @Operation(summary = "POST: Lưu quy định phân hạng mùa giải", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RaceController.saveSeasonRules()` -> `SeasonService.saveSeasonRules()`")
    public ResponseEntity<?> saveSeasonRules(@PathVariable Integer seasonId, @RequestBody List<SeasonClassRuleDTO> rules) {
        try {
            seasonService.saveSeasonRules(seasonId, rules);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/meetings")
    @Operation(summary = "GET: Lấy danh sách Ngày đua (Race Meetings)", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute'.\n\n📌 **Code Architecture**: `RaceController.getMeetings()` -> `RaceService.getAllMeetings()`")
    public ResponseEntity<List<RaceMeetingDTO>> getMeetings() {
        return ResponseEntity.ok(raceService.getAllMeetings());
    }

    @PostMapping("/meetings")
    @Operation(summary = "POST: Tạo mới Ngày đua (Race Meeting)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RaceController.createMeeting()` -> `RaceService.createMeeting()`")
    public ResponseEntity<?> createMeeting(@RequestBody RaceMeetingDTO meetingDTO) {
        try {
            RaceMeetingDTO savedMeeting = raceService.createMeeting(meetingDTO);
            return ResponseEntity.ok(Map.of("success", true, "meeting", savedMeeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/meetings/{id}")
    @Operation(summary = "POST: Cập nhật Ngày đua", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RaceController.updateMeeting()` -> `RaceService.updateMeeting()`")
    public ResponseEntity<?> updateMeeting(@PathVariable Integer id, @RequestBody RaceMeetingDTO meetingDTO) {
        try {
            RaceMeetingDTO updated = raceService.updateMeeting(id, meetingDTO);
            return ResponseEntity.ok(Map.of("success", true, "meeting", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/meetings/{id}")
    @Operation(summary = "DELETE: Xóa Ngày đua", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ DELETE API:**\n\n📌 **Code Architecture**: `RaceController.deleteMeeting()` -> `RaceService.deleteMeeting()`")
    public ResponseEntity<?> deleteMeeting(@PathVariable Integer id) {
        try {
            raceService.deleteMeeting(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race Meeting deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "GET: Lấy danh sách tất cả các trận đua (Races)", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute' để xem danh sách Trận đua.\n\n📌 **Code Architecture**: `RaceController.getRaces()` -> `RaceService.getAllRaces()`")
    public ResponseEntity<List<RaceDTO>> getRaces() {
        return ResponseEntity.ok(raceService.getAllRaces());
    }

    @PostMapping
    @Operation(summary = "POST: Tạo mới trận đua (Race)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RaceController.createRace()` -> `RaceService.createRace()`")
    public ResponseEntity<?> createRace(@RequestBody RaceDTO raceDTO) {
        try {
            RaceDTO savedRace = raceService.createRace(raceDTO);
            return ResponseEntity.ok(Map.of("success", true, "race", savedRace));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}")
    @Operation(summary = "POST: Cập nhật thông tin trận đua", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `RaceController.updateRace()` -> `RaceService.updateRace()`")
    public ResponseEntity<?> updateRace(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            RaceDTO updated = raceService.updateRace(id, body);
            return ResponseEntity.ok(Map.of("success", true, "race", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/live")
    @Operation(summary = "GET: Lấy danh sách các trận đua đang trực tiếp (Live)", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute'.\n\n📌 **Code Architecture**: `RaceController.getLiveRaces()` -> `RaceService.getLiveRaces()`")
    public ResponseEntity<List<RaceDTO>> getLiveRaces() {
        return ResponseEntity.ok(raceService.getLiveRaces());
    }
}
