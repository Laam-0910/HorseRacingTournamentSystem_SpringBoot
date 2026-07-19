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
    name = "Registration Service",
    description = "📋 **Cấu trúc Mô-đun Đăng Ký Tham Gia Ngày Đua (Registration Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `RegistrationController.java`, `AdminUserController.java`\n" +
                  "* **Services**: `RegistrationService.java` (`RegistrationServiceImpl.java`)\n" +
                  "* **Repositories**: `JockeyRaceMeetingRegistrationRepository.java`, `OwnerRaceMeetingRegistrationRepository.java`, `HorseRaceMeetingRegistrationRepository.java`\n" +
                  "* **Entities**: `JockeyRaceMeetingRegistration.java`, `OwnerRaceMeetingRegistration.java`, `HorseRaceMeetingRegistration.java`\n" +
                  "* **DTOs**: `RegistrationMeetingRequestDTO.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Nài ngựa/Chủ ngựa/Ngựa gửi đơn đăng ký tham gia Ngày đua (`Race Meeting`).\n" +
                  "2. Kiểm tra điều kiện tư cách thi đấu và trạng thái tài khoản.\n" +
                  "3. Đơn đăng ký lưu ở trạng thái `PENDING` chờ Admin phê duyệt."
)
public class RegistrationController {

    private final RegistrationService registrationService;

    @PostMapping("/jockey")
    @Operation(
        summary = "Nài ngựa đăng ký tham gia Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RegistrationController.registerJockey()`\n" +
                      "* **Service**: `RegistrationService.registerJockey()` (`RegistrationServiceImpl.java`)\n" +
                      "* **Repository**: `JockeyRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entity**: `JockeyRaceMeetingRegistration.java`\n" +
                      "* **DTO Request**: `RegistrationMeetingRequestDTO` (`meetingId`, `jockeyId`)\n" +
                      "* **DTO Response**: `JockeyRaceMeetingRegistrationDTO`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận Request gồm `meetingId` và `jockeyId`.\n" +
                      "2. Kiểm tra Nài ngựa xem có đang bị kỷ luật hoặc không đủ điều kiện không.\n" +
                      "3. Tạo bản ghi `JockeyRaceMeetingRegistration` ở trạng thái `PENDING`."
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
        summary = "Chủ ngựa đăng ký tham gia Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RegistrationController.registerOwner()`\n" +
                      "* **Service**: `RegistrationService.registerOwner()` (`RegistrationServiceImpl.java`)\n" +
                      "* **Repository**: `OwnerRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entity**: `OwnerRaceMeetingRegistration.java`\n" +
                      "* **DTO Request**: `RegistrationMeetingRequestDTO` (`meetingId`, `ownerId`)\n" +
                      "* **DTO Response**: `OwnerRaceMeetingRegistrationDTO`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận Request gồm `meetingId` và `ownerId`.\n" +
                      "2. Tạo bản ghi `OwnerRaceMeetingRegistration` chờ Admin xét duyệt."
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
        summary = "Ngựa đăng ký tham gia Ngày đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `RegistrationController.registerHorse()`\n" +
                      "* **Service**: `RegistrationService.registerHorse()` (`RegistrationServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entity**: `HorseRaceMeetingRegistration.java`\n" +
                      "* **DTO Request**: `RegistrationMeetingRequestDTO` (`meetingId`, `horseId`)\n" +
                      "* **DTO Response**: `HorseRaceMeetingRegistrationDTO`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra tình trạng sức khỏe chiến mã (`Horse.status == ACTIVE`).\n" +
                      "2. Tạo bản ghi `HorseRaceMeetingRegistration` chờ Admin xếp trận."
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
