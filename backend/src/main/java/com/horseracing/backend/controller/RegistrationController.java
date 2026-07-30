package com.horseracing.backend.controller;

import com.horseracing.backend.dto.HorseRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.JockeyRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.OwnerRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.RegistrationMeetingRequestDTO;
import com.horseracing.backend.service.RegistrationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller RegistrationController - Lớp kiểm soát các endpoint liên quan đến Đăng ký tham gia Ngày hội đua.
 * - Hỗ trợ kỵ sĩ gửi yêu cầu đăng ký tham gia ngày đua.
 * - Hỗ trợ chủ ngựa gửi yêu cầu đăng ký tham gia ngày đua.
 * - Hỗ trợ đăng ký chiến mã cụ thể tham gia ngày đua.
 * - Các yêu cầu đăng ký mặc định ở trạng thái PENDING chờ Admin phê duyệt.
 */
@RestController // Đánh dấu lớp là REST Controller để xử lý các yêu cầu HTTP từ frontend
@RequestMapping("/api/registrations") // Định nghĩa đường dẫn gốc cho các endpoint đăng ký ngày đua
@RequiredArgsConstructor // Tự động inject dependency bằng constructor chứa các trường final
@CrossOrigin(origins = "*") // Cho phép gọi API từ mọi domain (CORS)
@Tag(
    name = "07. Registration Service",
    description = "📋 **BƯỚC 7: ĐĂNG KÝ THAM GIA NGÀY ĐUA (REGISTRATION ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `RegistrationController.java`\n" +
                  "* **Services**: `RegistrationService.java`\n" +
                  "* **Repositories**: `JockeyRaceMeetingRegistrationRepository.java`, `OwnerRaceMeetingRegistrationRepository.java`, `HorseRaceMeetingRegistrationRepository.java`\n" +
                  "* **Entities**: `JockeyRaceMeetingRegistration.java`, `OwnerRaceMeetingRegistration.java`, `HorseRaceMeetingRegistration.java`\n" +
                  "* **DTOs**: `RegistrationMeetingRequestDTO.java`\n" +
                  "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `Jockey.tsx` (dashboards), `HorseOwner.tsx` (dashboards), `registrationProcessingService.ts`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Nài ngựa/Chủ ngựa/Ngựa nộp đơn đăng ký Ngày đua (`Race Meeting`).\n" +
                  "2. Đơn được lưu ở trạng thái `PENDING` chờ Admin duyệt."
)
public class RegistrationController {

    private final RegistrationService registrationService; // Dịch vụ xử lý đăng ký tham gia ngày hội đua

    // API phục vụ Nài ngựa đăng ký tham gia thi đấu tại Ngày hội đua
    @PostMapping("/jockey") // Xử lý HTTP POST request gửi tới /api/registrations/jockey
    @Operation(
        summary = "POST: Nài ngựa đăng ký tham gia Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RegistrationController.registerJockey()`\n" +
                      "* **Services**: `RegistrationService.registerJockey()`\n" +
                      "* **Repositories**: `JockeyRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entities**: `JockeyRaceMeetingRegistration.java`\n" +
                      "* **DTOs**: `RegistrationMeetingRequestDTO` (`meetingId`, `jockeyId`), `JockeyRaceMeetingRegistrationDTO`\n" +
                      "* **DTO Request**: `RegistrationMeetingRequestDTO` (`meetingId`, `jockeyId`)\n" +
                      "* **DTO Response**: `JockeyRaceMeetingRegistrationDTO`\n" +
                      "* **Frontend**: `Jockey.tsx` (dashboards), `RegistrationProcessing.tsx`, `registrationProcessingService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận `meetingId` và `jockeyId` từ request body.\n" +
                      "2. Kiểm tra Nài ngựa và Ngày đua có hợp lệ không.\n" +
                      "3. Tạo bản ghi `JockeyRaceMeetingRegistration` với trạng thái `PENDING`.\n" +
                      "4. Trả về thông tin đơn đăng ký vừa tạo."
    )
    public ResponseEntity<?> registerJockey(@RequestBody RegistrationMeetingRequestDTO body) {
        try {
            // Gọi dịch vụ đăng ký kỵ sĩ tham gia ngày đua theo meetingId và jockeyId
            JockeyRaceMeetingRegistrationDTO reg = registrationService.registerJockey(body.getMeetingId(), body.getJockeyId());
            // Trả về đối tượng DTO đơn đăng ký thành công với mã HTTP 200 OK
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            // Phản hồi mã lỗi Bad Request nếu tham số đăng ký của kỵ sĩ không hợp lệ
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // API phục vụ Chủ ngựa đăng ký tham gia Ngày hội đua
    @PostMapping("/owner") // Xử lý HTTP POST request gửi tới /api/registrations/owner
    @Operation(
        summary = "POST: Chủ ngựa đăng ký tham gia Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RegistrationController.registerOwner()`\n" +
                      "* **Services**: `RegistrationService.registerOwner()`\n" +
                      "* **Repositories**: `OwnerRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entities**: `OwnerRaceMeetingRegistration.java`\n" +
                      "* **DTOs**: `RegistrationMeetingRequestDTO` (`meetingId`, `ownerId`), `OwnerRaceMeetingRegistrationDTO`\n" +
                      "* **DTO Request**: `RegistrationMeetingRequestDTO` (`meetingId`, `ownerId`)\n" +
                      "* **DTO Response**: `OwnerRaceMeetingRegistrationDTO`\n" +
                      "* **Frontend**: `HorseOwner.tsx` (dashboards), `RegistrationProcessing.tsx`, `registrationProcessingService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận `meetingId` và `ownerId` từ request body.\n" +
                      "2. Kiểm tra Chủ ngựa và Ngày đua có hợp lệ không.\n" +
                      "3. Tạo bản ghi `OwnerRaceMeetingRegistration` với trạng thái `PENDING`.\n" +
                      "4. Trả về thông tin đơn đăng ký vừa tạo."
    )
    public ResponseEntity<?> registerOwner(@RequestBody RegistrationMeetingRequestDTO body) {
        try {
            // Gọi tầng nghiệp vụ để xử lý chủ ngựa đăng ký tham gia ngày đua
            OwnerRaceMeetingRegistrationDTO reg = registrationService.registerOwner(body.getMeetingId(), body.getOwnerId());
            // Trả về DTO đơn đăng ký thành công của chủ ngựa
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            // Xử lý ngoại lệ và trả về phản hồi lỗi Bad Request kèm thông báo
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // API phục vụ Chủ ngựa đăng ký từng con Ngựa đua cụ thể tham gia Ngày hội đua
    @PostMapping("/horse") // Xử lý HTTP POST request gửi tới /api/registrations/horse
    @Operation(
        summary = "POST: Ngựa đăng ký tham gia Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `RegistrationController.registerHorse()`\n" +
                      "* **Services**: `RegistrationService.registerHorse()`\n" +
                      "* **Repositories**: `HorseRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entities**: `HorseRaceMeetingRegistration.java`\n" +
                      "* **DTOs**: `RegistrationMeetingRequestDTO` (`meetingId`, `horseId`), `HorseRaceMeetingRegistrationDTO`\n" +
                      "* **DTO Request**: `RegistrationMeetingRequestDTO` (`meetingId`, `horseId`)\n" +
                      "* **DTO Response**: `HorseRaceMeetingRegistrationDTO`\n" +
                      "* **Frontend**: `HorseOwner.tsx` (dashboards), `RegistrationProcessing.tsx`, `registrationProcessingService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận `meetingId` và `horseId` từ request body.\n" +
                      "2. Kiểm tra Ngựa có trạng thái `ACTIVE` và Ngày đua có hợp lệ không.\n" +
                      "3. Tạo bản ghi `HorseRaceMeetingRegistration` với trạng thái `PENDING`.\n" +
                      "4. Trả về thông tin đơn đăng ký vừa tạo."
    )
    public ResponseEntity<?> registerHorse(@RequestBody RegistrationMeetingRequestDTO body) {
        try {
            // Gọi tầng nghiệp vụ để thực hiện đăng ký ngựa vào ngày đua theo meetingId và horseId
            HorseRaceMeetingRegistrationDTO reg = registrationService.registerHorse(body.getMeetingId(), body.getHorseId());
            // Trả về phản hồi thành công chứa DTO đơn đăng ký chiến mã
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            // Trả về mã lỗi HTTP 400 Bad Request kèm thông báo chi tiết nếu đăng ký không thành công
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
