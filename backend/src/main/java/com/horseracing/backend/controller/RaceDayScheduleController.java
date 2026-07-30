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

/**
 * Controller RaceDayScheduleController - Lớp kiểm soát các endpoint liên quan đến Lịch trình và Ngày hội đua (Race Meetings).
 * - Cung cấp danh sách các ngày hội đua đã lập lịch.
 * - Cho phép Admin tạo mới các ngày hội đua (lễ hội đua).
 */
@RestController
@RequestMapping("/api/schedule")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
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

    private final RaceService raceService; // Khai báo dịch vụ liên quan đến đua ngựa (quản lý meeting, race)

    // Lấy toàn bộ danh sách ngày hội đua
    @GetMapping("/meetings")
    @Operation(
        summary = "GET: Lấy danh sách các Ngày đua (Race Meetings)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceDayScheduleController.getMeetings()`\n" +
                      "* **Services**: `RaceService.getAllMeetings()`\n" +
                      "* **Repositories**: `RaceMeetingRepository.findAll()`\n" +
                      "* **Entities**: `RaceMeeting.java`\n" +
                      "* **DTOs**: `RaceMeetingDTO`\n" +
                      "* **DTO Response**: `List<RaceMeetingDTO>`\n" +
                      "* **Frontend**: `RaceDaySchedule.tsx` (admin-workflow), `raceDayScheduleService.ts`\n\n" +
                      "🔄 **LUỒNG TRA CỨU NGHIỆP VỤ:**\n" +
                      "1. Truy vấn danh sách toàn bộ Ngày hội đua trong cơ sở dữ liệu."
    )
    public ResponseEntity<List<RaceMeetingDTO>> getMeetings() {
        return ResponseEntity.ok(raceService.getAllMeetings()); // Trả về danh sách tất cả Ngày hội đua
    }

    // Tạo mới một ngày hội đua mới (Ví dụ: Xuân Hội, Hạ Hội)
    @PostMapping("/meetings")
    @Operation(
        summary = "POST: Tạo mới Ngày đua (Race Meeting)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RaceDayScheduleController.createMeeting()`\n" +
                      "* **Services**: `RaceService.createMeeting()`\n" +
                      "* **Repositories**: `RaceMeetingRepository.save()`\n" +
                      "* **Entities**: `RaceMeeting.java`\n" +
                      "* **DTOs**: `RaceMeetingDTO` (`name`, `location`, `meetingDate`, `status`), `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **DTO Request**: `RaceMeetingDTO` (`name`, `location`, `meetingDate`, `status`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"meeting\": RaceMeetingDTO}`)\n" +
                      "* **Frontend**: `RaceDaySchedule.tsx` (admin-workflow), `raceDayScheduleService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận payload `RaceMeetingDTO` từ client.\n" +
                      "2. Validate thông tin Tên ngày đua, Địa điểm và Ngày tổ chức.\n" +
                      "3. Chuyển DTO thành `RaceMeeting` Entity và lưu vào cơ sở dữ liệu MSSQL.\n" +
                      "4. Trả về kết quả JSON thông báo khởi tạo thành công."
    )
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
