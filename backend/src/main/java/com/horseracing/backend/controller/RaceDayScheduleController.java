package com.horseracing.backend.controller;

import com.horseracing.backend.dto.RaceMeetingDTO;
import com.horseracing.backend.service.RaceService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller RaceDayScheduleController - Lớp kiểm soát các endpoint liên quan đến Lịch trình và Ngày hội đua (Race Meetings).
 * - Cung cấp danh sách các ngày hội đua đã lập lịch.
 * - Cho phép Admin tạo mới các ngày hội đua (lễ hội đua).
 */
@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
public class RaceDayScheduleController {

    private final RaceService raceService; // Khai báo dịch vụ liên quan đến đua ngựa (quản lý meeting, race)

    // Lấy toàn bộ danh sách ngày hội đua
    @GetMapping("/meetings")
        public ResponseEntity<List<RaceMeetingDTO>> getMeetings() {
        return ResponseEntity.ok(raceService.getAllMeetings()); // Trả về danh sách tất cả Ngày hội đua
    }

    // Tạo mới một ngày hội đua mới (Ví dụ: Xuân Hội, Hạ Hội)
    @PostMapping("/meetings")
        public ResponseEntity<?> createMeeting(@RequestBody RaceMeetingDTO meetingDTO) {
        try {
            // Thực thi lưu trữ ngày hội đua ở tầng dịch vụ
            RaceMeetingDTO saved = raceService.createMeeting(meetingDTO); // Gọi service tạo mới Ngày hội đua từ DTO
            return ResponseEntity.ok(Map.of("success", true, "meeting", saved)); // Trả về HTTP 200 kèm DTO Ngày hội đua đã tạo thành công
        } catch (Exception e) {
            // Trả về mã lỗi 400 Bad Request kèm thông điệp chi tiết lỗi
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage())); // Trả về HTTP 400 Bad Request kèm thông báo lỗi
        }
    }
}
