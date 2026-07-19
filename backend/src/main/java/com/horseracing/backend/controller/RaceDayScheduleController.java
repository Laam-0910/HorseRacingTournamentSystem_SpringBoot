package com.horseracing.backend.controller;

import com.horseracing.backend.dto.RaceMeetingDTO;
import com.horseracing.backend.service.RaceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "Schedule Service", description = "Quản lý lịch trình và các Ngày đua (Race Meeting)")
public class RaceDayScheduleController {

    private final RaceService raceService;

    @GetMapping("/meetings")
    @Operation(summary = "Lấy danh sách các Ngày đua (Race Meetings)", description = "📌 **Code Handler**: `RaceDayScheduleController.getMeetings()` -> `RaceService.getAllMeetings()`")
    public ResponseEntity<List<RaceMeetingDTO>> getMeetings() {
        return ResponseEntity.ok(raceService.getAllMeetings());
    }

    @PostMapping("/meetings")
    @Operation(summary = "Tạo mới Ngày đua", description = "📌 **Code Handler**: `RaceDayScheduleController.createMeeting()` -> `RaceService.createMeeting()`")
    public ResponseEntity<?> createMeeting(@RequestBody RaceMeetingDTO meetingDTO) {
        try {
            RaceMeetingDTO saved = raceService.createMeeting(meetingDTO);
            return ResponseEntity.ok(Map.of("success", true, "meeting", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
