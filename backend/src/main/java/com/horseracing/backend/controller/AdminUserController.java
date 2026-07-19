package com.horseracing.backend.controller;

import com.horseracing.backend.dto.*;
import com.horseracing.backend.service.AdminUserService;
import com.horseracing.backend.service.RaceService;
import com.horseracing.backend.service.SystemConfigService;
import com.horseracing.backend.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(
    name = "09. Admin & Racecard Service",
    description = "🛡️ **BƯỚC 9: DUYỆT ĐƠN, GÁN TRỌNG TÀI & XẾP THẺ ĐUA RACECARD (ADMIN ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `AdminUserController.java`\n" +
                  "* **Services**: `AdminUserService.java` (`AdminUserServiceImpl.java`), `UserService.java`, `RaceService.java`\n" +
                  "* **Repositories**: `UserRepository.java`, `HorseRepository.java`, `RaceEntryRepository.java`\n" +
                  "* **Entities**: `User.java`, `Horse.java`, `RaceReferee.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Admin duyệt các đơn đăng ký thi đấu của Nài, Chủ và Ngựa (`pending-registrations`).\n" +
                  "2. Gán Trọng tài vào trận đua (`assignReferee`).\n" +
                  "3. Tự động hóa thẻ đua: Tự động sắp cổng xuất phát (`autoAssignGates`) và tính tạ gánh chì (`autoCalculateWeights`).\n" +
                  "4. Gắn đường dẫn Youtube Livestream cho trận đua."
)
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserService userService;
    private final SystemConfigService systemConfigService;
    private final RaceService raceService;

    // --- User Management ---
    @GetMapping("/users")
    @Operation(
        summary = "GET: Lấy danh sách tất cả người dùng",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> 'Execute' để lấy danh sách người dùng.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.getAllUsers()`\n" +
                      "* **Service**: `UserService.getAllUsers()` (`UserServiceImpl.java`)\n" +
                      "* **Repository**: `UserRepository.findAll()`\n" +
                      "* **Entity**: `User.java`\n" +
                      "* **DTO Response**: `List<UserDTO>`"
    )
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/users")
    @Operation(
        summary = "POST: Tạo mới người dùng thủ công",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.createUser()`\n" +
                      "* **Service**: `UserService.createUserManual()` (`UserServiceImpl.java`)\n" +
                      "* **Repository**: `UserRepository.save()`\n" +
                      "* **Entity**: `User.java`\n" +
                      "* **DTO Request**: `CreateUserRequestDTO` (`username`, `email`, `password`, `roleId`, `weight`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"user\": UserDTO}`)"
    )
    public ResponseEntity<?> createUser(@RequestBody CreateUserRequestDTO body) {
        try {
            UserDTO created = userService.createUserManual(
                    body.getUsername(),
                    body.getEmail(),
                    body.getPassword(),
                    body.getRoleId(),
                    body.getWeight()
            );
            return ResponseEntity.ok(Map.of("success", true, "user", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}")
    @Operation(
        summary = "POST: Cập nhật thông tin người dùng",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.updateUser()`\n" +
                      "* **Service**: `UserService.updateUser()` (`UserServiceImpl.java`)\n" +
                      "* **Repository**: `UserRepository.save()`\n" +
                      "* **DTO Request**: `UpdateUserRequestDTO` (`username`, `email`, `roleId`, `requireOtp`, `weight`)"
    )
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody UpdateUserRequestDTO body) {
        try {
            UserDTO updated = userService.updateUser(
                    id,
                    body.getUsername(),
                    body.getEmail(),
                    body.getRoleId(),
                    body.getRequireOtp(),
                    body.getWeight()
            );
            return ResponseEntity.ok(Map.of("success", true, "user", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/toggle")
    @Operation(
        summary = "POST: Bật/Khóa tài khoản người dùng",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.toggleUserStatus()`\n" +
                      "* **Service**: `UserService.toggleUserStatus()` (`UserServiceImpl.java`)\n" +
                      "* **Repository**: `UserRepository.save()`"
    )
    public ResponseEntity<?> toggleUserStatus(@PathVariable Integer id) {
        try {
            String status = userService.toggleUserStatus(id);
            return ResponseEntity.ok(Map.of("success", true, "status", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- Race & Referee Assignment ---
    @PostMapping("/races/{raceId}/referee")
    @Operation(
        summary = "POST: Gán Trọng tài vào trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.assignReferee()`\n" +
                      "* **Service**: `AdminUserService.assignReferee()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRefereeRepository.save()`\n" +
                      "* **Entity**: `RaceReferee.java`\n" +
                      "* **DTO Request**: `AssignRefereeRequestDTO` (`refereeId`)"
    )
    public ResponseEntity<?> assignReferee(@PathVariable Integer raceId, @RequestBody AssignRefereeRequestDTO body) {
        try {
            adminUserService.assignReferee(raceId, body.getRefereeId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/referee/remove")
    @Operation(
        summary = "POST: Hủy gán Trọng tài khỏi trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.removeReferee()`\n" +
                      "* **Service**: `AdminUserService.removeReferee()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRefereeRepository.delete()`"
    )
    public ResponseEntity<?> removeReferee(@PathVariable Integer raceId, @RequestBody AssignRefereeRequestDTO body) {
        try {
            adminUserService.removeReferee(raceId, body.getRefereeId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/races/referees")
    @Operation(
        summary = "GET: Lấy danh sách phân công Trọng tài",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.getRaceReferees()`\n" +
                      "* **Service**: `AdminUserService.getRaceRefereesMap()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRefereeRepository.findAll()`"
    )
    public ResponseEntity<?> getRaceReferees() {
        return ResponseEntity.ok(adminUserService.getRaceRefereesMap());
    }

    // --- Livestream ---
    @PostMapping("/races/{raceId}/live")
    @Operation(
        summary = "POST: Cập nhật link Youtube Livestream",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.setLiveUrl()`\n" +
                      "* **Service**: `RaceService.updateRace()` (`RaceServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRepository.save()`\n" +
                      "* **DTO Request**: `UpdateLiveUrlRequestDTO` (`youtubeLiveUrl`)"
    )
    public ResponseEntity<?> setLiveUrl(@PathVariable Integer raceId, @RequestBody UpdateLiveUrlRequestDTO body) {
        try {
            raceService.updateRace(raceId, Map.of("youtubeLiveUrl", body.getYoutubeLiveUrl()));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/live/remove")
    @Operation(
        summary = "POST: Xóa link Livestream",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.removeLiveUrl()`\n" +
                      "* **Service**: `RaceService.updateRace()` (`RaceServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRepository.save()`"
    )
    public ResponseEntity<?> removeLiveUrl(@PathVariable Integer raceId) {
        try {
            raceService.updateRace(raceId, Map.of("youtubeLiveUrl", ""));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- System Config ---
    @GetMapping("/configs")
    @Operation(
        summary = "GET: Lấy cấu hình hệ thống (Admin)",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.getConfigs()`\n" +
                      "* **Service**: `SystemConfigService.getAllConfigs()` (`SystemConfigServiceImpl.java`)\n" +
                      "* **Repository**: `SystemConfigRepository.findAll()`\n" +
                      "* **DTO Response**: `List<SystemConfigDTO>`"
    )
    public ResponseEntity<List<SystemConfigDTO>> getConfigs() {
        return ResponseEntity.ok(systemConfigService.getAllConfigs());
    }

    @PostMapping("/configs")
    @Operation(
        summary = "POST: Cập nhật cấu hình hệ thống (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.updateConfigs()`\n" +
                      "* **Service**: `SystemConfigService.updateConfigs()` (`SystemConfigServiceImpl.java`)\n" +
                      "* **Repository**: `SystemConfigRepository.saveAll()`"
    )
    public ResponseEntity<?> updateConfigs(@RequestBody Map<String, String> body) {
        try {
            systemConfigService.updateConfigs(body);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- Registrations & Approvals ---
    @GetMapping("/pending-registrations")
    @Operation(
        summary = "GET: Lấy danh sách đơn đăng ký chờ duyệt",
        description = "🔍 **CHẠY THỬ TRY IT OUT**: Bấm 'Try it out' -> 'Execute'.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.getPendingRegistrations()`\n" +
                      "* **Service**: `AdminUserService.getPendingRegistrations()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repositories**: `JockeyRaceMeetingRegistrationRepository`, `OwnerRaceMeetingRegistrationRepository`, `HorseRaceMeetingRegistrationRepository`"
    )
    public ResponseEntity<?> getPendingRegistrations() {
        try {
            Map<String, Object> pending = adminUserService.getPendingRegistrations();
            return ResponseEntity.ok(pending);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entries/{id}/approve")
    @Operation(
        summary = "POST: Phê duyệt đơn đăng ký trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.approveRaceEntry()`\n" +
                      "* **Service**: `AdminUserService.approveRaceEntry()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `RaceEntryRepository.save()`"
    )
    public ResponseEntity<?> approveRaceEntry(@PathVariable Integer id) {
        try {
            adminUserService.approveRaceEntry(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entries/{id}/reject")
    @Operation(
        summary = "POST: Từ chối đơn đăng ký trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.rejectRaceEntry()`\n" +
                      "* **Service**: `AdminUserService.rejectRaceEntry()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `RaceEntryRepository.save()`"
    )
    public ResponseEntity<?> rejectRaceEntry(@PathVariable Integer id) {
        try {
            adminUserService.rejectRaceEntry(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/jockey-reg/{id}/approve")
    @Operation(
        summary = "POST: Phê duyệt đơn đăng ký Nài ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.approveJockeyReg()`\n" +
                      "* **Service**: `AdminUserService.approveJockeyReg()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `JockeyRaceMeetingRegistrationRepository.save()`"
    )
    public ResponseEntity<?> approveJockeyReg(@PathVariable Integer id) {
        try {
            adminUserService.approveJockeyReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/jockey-reg/{id}/reject")
    @Operation(
        summary = "POST: Từ chối đơn đăng ký Nài ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.rejectJockeyReg()`\n" +
                      "* **Service**: `AdminUserService.rejectJockeyReg()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `JockeyRaceMeetingRegistrationRepository.save()`"
    )
    public ResponseEntity<?> rejectJockeyReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectJockeyReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/owner-reg/{id}/approve")
    @Operation(
        summary = "POST: Phê duyệt đơn đăng ký Chủ ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.approveOwnerReg()`\n" +
                      "* **Service**: `AdminUserService.approveOwnerReg()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `OwnerRaceMeetingRegistrationRepository.save()`"
    )
    public ResponseEntity<?> approveOwnerReg(@PathVariable Integer id) {
        try {
            adminUserService.approveOwnerReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/owner-reg/{id}/reject")
    @Operation(
        summary = "POST: Từ chối đơn đăng ký Chủ ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.rejectOwnerReg()`\n" +
                      "* **Service**: `AdminUserService.rejectOwnerReg()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `OwnerRaceMeetingRegistrationRepository.save()`"
    )
    public ResponseEntity<?> rejectOwnerReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectOwnerReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/horse-reg/{id}/approve")
    @Operation(
        summary = "POST: Phê duyệt đơn đăng ký Ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.approveHorseReg()`\n" +
                      "* **Service**: `AdminUserService.approveHorseReg()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRaceMeetingRegistrationRepository.save()`"
    )
    public ResponseEntity<?> approveHorseReg(@PathVariable Integer id) {
        try {
            adminUserService.approveHorseReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/horse-reg/{id}/reject")
    @Operation(
        summary = "POST: Từ chối đơn đăng ký Ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.rejectHorseReg()`\n" +
                      "* **Service**: `AdminUserService.rejectHorseReg()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRaceMeetingRegistrationRepository.save()`"
    )
    public ResponseEntity<?> rejectHorseReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectHorseReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/system-horse/{id}/approve")
    @Operation(
        summary = "POST: Duyệt ngựa hệ thống",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.approveSystemHorse()`\n" +
                      "* **Service**: `AdminUserService.approveSystemHorse()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRepository.save()`"
    )
    public ResponseEntity<?> approveSystemHorse(@PathVariable Integer id) {
        try {
            adminUserService.approveSystemHorse(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/system-horse/{id}/reject")
    @Operation(
        summary = "POST: Từ chối ngựa hệ thống",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.rejectSystemHorse()`\n" +
                      "* **Service**: `AdminUserService.rejectSystemHorse()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `HorseRepository.save()`"
    )
    public ResponseEntity<?> rejectSystemHorse(@PathVariable Integer id) {
        try {
            adminUserService.rejectSystemHorse(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- Racecard Automation ---
    @PostMapping("/races/{raceId}/auto-assign-gates")
    @Operation(
        summary = "POST: Tự động sắp xếp cổng xuất phát",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.autoAssignGates()`\n" +
                      "* **Service**: `AdminUserService.autoAssignGates()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `RaceEntryRepository.saveAll()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Thuật toán ngẫu nhiên phân bổ cổng xuất phát `gateNumber` (1..N) cho các `RaceEntry` tham gia trận đua."
    )
    public ResponseEntity<?> autoAssignGates(@PathVariable Integer raceId) {
        try {
            adminUserService.autoAssignGates(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Gates successfully auto-assigned."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/auto-calculate-weights")
    @Operation(
        summary = "POST: Tự động tính toán tạ gánh chì (Handicap Weight)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.autoCalculateWeights()`\n" +
                      "* **Service**: `AdminUserService.autoCalculateWeights()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `RaceEntryRepository.saveAll()`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tính toán số tạ chì gánh (`assignedWeight`) dựa trên Rating hiện tại của ngựa so với chuẩn Rating của Hạng đua."
    )
    public ResponseEntity<?> autoCalculateWeights(@PathVariable Integer raceId) {
        try {
            adminUserService.autoCalculateWeights(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Handicap weights auto-calculated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/racecard")
    @Operation(
        summary = "POST: Cập nhật thông tin thẻ đua (Racecard)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.updateRacecard()`\n" +
                      "* **Service**: `AdminUserService.updateRacecard()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `RaceEntryRepository.saveAll()`"
    )
    public ResponseEntity<?> updateRacecard(@PathVariable Integer raceId, @RequestBody List<Map<String, Object>> body) {
        try {
            adminUserService.updateRacecard(raceId, body);
            return ResponseEntity.ok(Map.of("success", true, "message", "Racecard updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/cancel")
    @Operation(
        summary = "POST: Hủy bỏ trận đua (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AdminUserController.cancelRace()`\n" +
                      "* **Service**: `AdminUserService.cancelRace()` (`AdminUserServiceImpl.java`)\n" +
                      "* **Repository**: `RaceRepository.save()`"
    )
    public ResponseEntity<?> cancelRace(@PathVariable Integer raceId) {
        try {
            adminUserService.cancelRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race cancelled successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
