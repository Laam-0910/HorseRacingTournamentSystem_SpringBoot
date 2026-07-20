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

@RestController
@RequestMapping("/api/registrations")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
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

    private final RegistrationService registrationService;

    @PostMapping("/jockey")
    @Operation(
        summary = "POST: Nài ngựa đăng ký tham gia Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RegistrationController.registerJockey()`\n" +
                      "* **Service**: `RegistrationService.registerJockey()`\n" +
                      "* **Repository**: `JockeyRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entity**: `JockeyRaceMeetingRegistration.java`\n" +
                      "* **DTO Request**: `RegistrationMeetingRequestDTO` (`meetingId`, `jockeyId`)\n" +
                      "* **DTO Response**: `JockeyRaceMeetingRegistrationDTO`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận `meetingId` và `jockeyId` từ request body.\n" +
                      "2. Kiểm tra Nài ngựa và Ngày đua có hợp lệ không.\n" +
                      "3. Tạo bản ghi `JockeyRaceMeetingRegistration` với trạng thái `PENDING`.\n" +
                      "4. Trả về thông tin đơn đăng ký vừa tạo."
    )
    public ResponseEntity<?> registerJockey(@RequestBody RegistrationMeetingRequestDTO body) {
        try {
            JockeyRaceMeetingRegistrationDTO reg = registrationService.registerJockey(body.getMeetingId(), body.getJockeyId());
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/owner")
    @Operation(
        summary = "POST: Chủ ngựa đăng ký tham gia Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RegistrationController.registerOwner()`\n" +
                      "* **Service**: `RegistrationService.registerOwner()`\n" +
                      "* **Repository**: `OwnerRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entity**: `OwnerRaceMeetingRegistration.java`\n" +
                      "* **DTO Request**: `RegistrationMeetingRequestDTO` (`meetingId`, `ownerId`)\n" +
                      "* **DTO Response**: `OwnerRaceMeetingRegistrationDTO`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận `meetingId` và `ownerId` từ request body.\n" +
                      "2. Kiểm tra Chủ ngựa và Ngày đua có hợp lệ không.\n" +
                      "3. Tạo bản ghi `OwnerRaceMeetingRegistration` với trạng thái `PENDING`.\n" +
                      "4. Trả về thông tin đơn đăng ký vừa tạo."
    )
    public ResponseEntity<?> registerOwner(@RequestBody RegistrationMeetingRequestDTO body) {
        try {
            OwnerRaceMeetingRegistrationDTO reg = registrationService.registerOwner(body.getMeetingId(), body.getOwnerId());
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/horse")
    @Operation(
        summary = "POST: Ngựa đăng ký tham gia Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RegistrationController.registerHorse()`\n" +
                      "* **Service**: `RegistrationService.registerHorse()`\n" +
                      "* **Repository**: `HorseRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entity**: `HorseRaceMeetingRegistration.java`\n" +
                      "* **DTO Request**: `RegistrationMeetingRequestDTO` (`meetingId`, `horseId`)\n" +
                      "* **DTO Response**: `HorseRaceMeetingRegistrationDTO`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận `meetingId` và `horseId` từ request body.\n" +
                      "2. Kiểm tra Ngựa có trạng thái `ACTIVE` và Ngày đua có hợp lệ không.\n" +
                      "3. Tạo bản ghi `HorseRaceMeetingRegistration` với trạng thái `PENDING`.\n" +
                      "4. Trả về thông tin đơn đăng ký vừa tạo."
    )
    public ResponseEntity<?> registerHorse(@RequestBody RegistrationMeetingRequestDTO body) {
        try {
            HorseRaceMeetingRegistrationDTO reg = registrationService.registerHorse(body.getMeetingId(), body.getHorseId());
            return ResponseEntity.ok(reg);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
