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
@Tag(
    name = "04. Schedule & Race Meeting Service",
    description = "📅 **BƯỚC 4: LỊCH TRÌNH & NGÀY ĐUA (SCHEDULE ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `RaceDayScheduleController.java`, `RaceController.java`\n" +
                  "* **Services**: `RaceService.java`\n" +
                  "* **Repositories**: `RaceMeetingRepository.java`, `RaceRepository.java`\n" +
                  "* **Entities**: `RaceMeeting.java`, `Race.java`\n" +
                  "* **DTOs**: `RaceMeetingDTO.java`\n" +
                  "* **Frontend**: `RaceDaySchedule.tsx` (admin-workflow), `RaceMeeting.tsx`, `raceDayScheduleService.ts`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Admin tạo **Ngày đua (`RaceMeeting`)** trên lịch thi đấu.\n" +
                  "2. Hệ thống kiểm tra trùng lặp thời điểm tổ chức.\n" +
                  "3. Mở cổng đăng ký Ngày đua cho Chủ ngựa & Nài ngựa tham gia."
)
public class RaceDayScheduleController {

    private final RaceService raceService;

    @GetMapping("/meetings")
    @Operation(
        summary = "GET: Lấy danh sách các Ngày đua (Race Meetings)",
        description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute' để xem danh sách toàn bộ Ngày đua đang có.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RaceDayScheduleController.getMeetings()`\n" +
                      "* **Service**: `RaceService.getAllMeetings()`\n" +
                      "* **Repository**: `RaceMeetingRepository.findAll()`\n" +
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
                      "* **Controller**: `RaceDayScheduleController.createMeeting()`\n" +
                      "* **Service**: `RaceService.createMeeting()`\n" +
                      "* **Repository**: `RaceMeetingRepository.save()`\n" +
                      "* **Entity**: `RaceMeeting.java`\n" +
                      "* **DTO Request**: `RaceMeetingDTO` (`name`, `location`, `meetingDate`, `status`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"meeting\": RaceMeetingDTO}`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận payload `RaceMeetingDTO` từ client.\n" +
                      "2. Validate thông tin Tên ngày đua, Địa điểm và Ngày tổ chức.\n" +
                      "3. Chuyển DTO thành `RaceMeeting` Entity và lưu vào cơ sở dữ liệu MSSQL.\n" +
                      "4. Trả về kết quả JSON thông báo khởi tạo thành công."
    )
    public ResponseEntity<?> createMeeting(@RequestBody RaceMeetingDTO meetingDTO) {
        try {
            RaceMeetingDTO saved = raceService.createMeeting(meetingDTO);
            return ResponseEntity.ok(Map.of("success", true, "meeting", saved));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
