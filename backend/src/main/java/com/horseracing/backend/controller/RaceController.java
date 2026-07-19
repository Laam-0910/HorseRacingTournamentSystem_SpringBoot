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
@Tag(name = "Race & Season Service", description = "Quản lý Mùa giải, Ngày đua (Race Meeting) và Trận đua (Race)")
public class RaceController {

    private final RaceService raceService;
    private final SeasonService seasonService;

    @GetMapping("/seasons")
    @Operation(summary = "Lấy danh sách các mùa giải")
    public ResponseEntity<List<SeasonDTO>> getSeasons() {
        return ResponseEntity.ok(seasonService.getAllSeasons());
    }

    @PostMapping("/seasons")
    @Operation(summary = "Tạo mùa giải đua mới")
    public ResponseEntity<?> createSeason(@RequestBody Map<String, Object> body) {
        try {
            SeasonDTO season = seasonService.createSeason(body);
            return ResponseEntity.ok(Map.of("success", true, "season", season));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/seasons/{id}/toggle")
    @Operation(summary = "Bật/Kích hoạt trạng thái mùa giải")
    public ResponseEntity<?> toggleSeasonStatus(@PathVariable Integer id) {
        try {
            String status = seasonService.toggleSeasonStatus(id);
            return ResponseEntity.ok(Map.of("success", true, "status", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/seasons/{id}/extend")
    @Operation(summary = "Gia hạn thời gian mùa giải")
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
    @Operation(summary = "Lấy danh sách quy định phân hạng mùa giải")
    public ResponseEntity<List<SeasonClassRuleDTO>> getSeasonRules(@PathVariable Integer seasonId) {
        return ResponseEntity.ok(seasonService.getSeasonRules(seasonId));
    }

    @PostMapping("/seasons/{seasonId}/rules")
    @Operation(summary = "Lưu quy định phân hạng mùa giải")
    public ResponseEntity<?> saveSeasonRules(@PathVariable Integer seasonId, @RequestBody List<SeasonClassRuleDTO> rules) {
        try {
            seasonService.saveSeasonRules(seasonId, rules);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/meetings")
    @Operation(summary = "Lấy danh sách Ngày đua (Race Meetings)")
    public ResponseEntity<List<RaceMeetingDTO>> getMeetings() {
        return ResponseEntity.ok(raceService.getAllMeetings());
    }

    @PostMapping("/meetings")
    @Operation(summary = "Tạo mới Ngày đua (Race Meeting)")
    public ResponseEntity<?> createMeeting(@RequestBody RaceMeetingDTO meetingDTO) {
        try {
            RaceMeetingDTO savedMeeting = raceService.createMeeting(meetingDTO);
            return ResponseEntity.ok(Map.of("success", true, "meeting", savedMeeting));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/meetings/{id}")
    @Operation(summary = "Cập nhật Ngày đua")
    public ResponseEntity<?> updateMeeting(@PathVariable Integer id, @RequestBody RaceMeetingDTO meetingDTO) {
        try {
            RaceMeetingDTO updated = raceService.updateMeeting(id, meetingDTO);
            return ResponseEntity.ok(Map.of("success", true, "meeting", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @DeleteMapping("/meetings/{id}")
    @Operation(summary = "Xóa Ngày đua")
    public ResponseEntity<?> deleteMeeting(@PathVariable Integer id) {
        try {
            raceService.deleteMeeting(id);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race Meeting deleted successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping
    @Operation(summary = "Lấy danh sách tất cả các trận đua (Races)")
    public ResponseEntity<List<RaceDTO>> getRaces() {
        return ResponseEntity.ok(raceService.getAllRaces());
    }

    @PostMapping
    @Operation(summary = "Tạo mới trận đua (Race)")
    public ResponseEntity<?> createRace(@RequestBody RaceDTO raceDTO) {
        try {
            RaceDTO savedRace = raceService.createRace(raceDTO);
            return ResponseEntity.ok(Map.of("success", true, "race", savedRace));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin trận đua")
    public ResponseEntity<?> updateRace(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            RaceDTO updated = raceService.updateRace(id, body);
            return ResponseEntity.ok(Map.of("success", true, "race", updated));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/live")
    @Operation(summary = "Lấy danh sách các trận đua đang diễn ra trực tiếp (Live)")
    public ResponseEntity<List<RaceDTO>> getLiveRaces() {
        return ResponseEntity.ok(raceService.getLiveRaces());
    }
}
