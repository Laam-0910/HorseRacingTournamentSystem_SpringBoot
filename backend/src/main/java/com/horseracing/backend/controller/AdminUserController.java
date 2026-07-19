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
    description = "🛡️ **BƯỚC 9: DỰỆT ĐƠN, GÁN TRỌNG TÀI & XẾP THẺ ĐUA RACECARD (ADMIN ARCHITECTURE)**\n\n" +
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
    @Operation(summary = "GET: Lấy danh sách tất cả người dùng", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute'.\n\n📌 **Code Architecture**: `AdminUserController.getAllUsers()` -> `UserService.getAllUsers()`")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/users")
    @Operation(summary = "POST: Tạo mới người dùng thủ công", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.createUser()` -> `UserService.createUserManual()`")
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
    @Operation(summary = "POST: Cập nhật thông tin người dùng", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.updateUser()` -> `UserService.updateUser()`")
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
    @Operation(summary = "POST: Bật/Khóa tài khoản người dùng", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.toggleUserStatus()` -> `UserService.toggleUserStatus()`")
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
    @Operation(summary = "POST: Gán Trọng tài vào trận đua", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.assignReferee()` -> `AdminUserService.assignReferee()`")
    public ResponseEntity<?> assignReferee(@PathVariable Integer raceId, @RequestBody AssignRefereeRequestDTO body) {
        try {
            adminUserService.assignReferee(raceId, body.getRefereeId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/referee/remove")
    @Operation(summary = "POST: Hủy gán Trọng tài khỏi trận đua", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.removeReferee()` -> `AdminUserService.removeReferee()`")
    public ResponseEntity<?> removeReferee(@PathVariable Integer raceId, @RequestBody AssignRefereeRequestDTO body) {
        try {
            adminUserService.removeReferee(raceId, body.getRefereeId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/races/referees")
    @Operation(summary = "GET: Lấy danh sách phân công Trọng tài", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute'.\n\n📌 **Code Architecture**: `AdminUserController.getRaceReferees()` -> `AdminUserService.getRaceRefereesMap()`")
    public ResponseEntity<?> getRaceReferees() {
        return ResponseEntity.ok(adminUserService.getRaceRefereesMap());
    }

    // --- Livestream ---
    @PostMapping("/races/{raceId}/live")
    @Operation(summary = "POST: Cập nhật link Youtube Livestream", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.setLiveUrl()` -> `RaceService.updateRace()`")
    public ResponseEntity<?> setLiveUrl(@PathVariable Integer raceId, @RequestBody UpdateLiveUrlRequestDTO body) {
        try {
            raceService.updateRace(raceId, Map.of("youtubeLiveUrl", body.getYoutubeLiveUrl()));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/live/remove")
    @Operation(summary = "POST: Xóa link Livestream", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.removeLiveUrl()` -> `RaceService.updateRace()`")
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
    @Operation(summary = "GET: Lấy cấu hình hệ thống (Admin)", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute'.\n\n📌 **Code Architecture**: `AdminUserController.getConfigs()` -> `SystemConfigService.getAllConfigs()`")
    public ResponseEntity<List<SystemConfigDTO>> getConfigs() {
        return ResponseEntity.ok(systemConfigService.getAllConfigs());
    }

    @PostMapping("/configs")
    @Operation(summary = "POST: Cập nhật cấu hình hệ thống (Admin)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.updateConfigs()` -> `SystemConfigService.updateConfigs()`")
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
    @Operation(summary = "GET: Lấy danh sách đơn đăng ký chờ duyệt", description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute'.\n\n📌 **Code Architecture**: `AdminUserController.getPendingRegistrations()` -> `AdminUserService.getPendingRegistrations()`")
    public ResponseEntity<?> getPendingRegistrations() {
        try {
            Map<String, Object> pending = adminUserService.getPendingRegistrations();
            return ResponseEntity.ok(pending);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entries/{id}/approve")
    @Operation(summary = "POST: Phê duyệt đơn đăng ký trận đua", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.approveRaceEntry()` -> `AdminUserService.approveRaceEntry()`")
    public ResponseEntity<?> approveRaceEntry(@PathVariable Integer id) {
        try {
            adminUserService.approveRaceEntry(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entries/{id}/reject")
    @Operation(summary = "POST: Từ chối đơn đăng ký trận đua", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.rejectRaceEntry()` -> `AdminUserService.rejectRaceEntry()`")
    public ResponseEntity<?> rejectRaceEntry(@PathVariable Integer id) {
        try {
            adminUserService.rejectRaceEntry(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/jockey-reg/{id}/approve")
    @Operation(summary = "POST: Phê duyệt đơn đăng ký Nài ngựa", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.approveJockeyReg()` -> `AdminUserService.approveJockeyReg()`")
    public ResponseEntity<?> approveJockeyReg(@PathVariable Integer id) {
        try {
            adminUserService.approveJockeyReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/jockey-reg/{id}/reject")
    @Operation(summary = "POST: Từ chối đơn đăng ký Nài ngựa", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.rejectJockeyReg()` -> `AdminUserService.rejectJockeyReg()`")
    public ResponseEntity<?> rejectJockeyReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectJockeyReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/owner-reg/{id}/approve")
    @Operation(summary = "POST: Phê duyệt đơn đăng ký Chủ ngựa", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.approveOwnerReg()` -> `AdminUserService.approveOwnerReg()`")
    public ResponseEntity<?> approveOwnerReg(@PathVariable Integer id) {
        try {
            adminUserService.approveOwnerReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/owner-reg/{id}/reject")
    @Operation(summary = "POST: Từ chối đơn đăng ký Chủ ngựa", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.rejectOwnerReg()` -> `AdminUserService.rejectOwnerReg()`")
    public ResponseEntity<?> rejectOwnerReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectOwnerReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/horse-reg/{id}/approve")
    @Operation(summary = "POST: Phê duyệt đơn đăng ký Ngựa", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.approveHorseReg()` -> `AdminUserService.approveHorseReg()`")
    public ResponseEntity<?> approveHorseReg(@PathVariable Integer id) {
        try {
            adminUserService.approveHorseReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/horse-reg/{id}/reject")
    @Operation(summary = "POST: Từ chối đơn đăng ký Ngựa", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.rejectHorseReg()` -> `AdminUserService.rejectHorseReg()`")
    public ResponseEntity<?> rejectHorseReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectHorseReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/system-horse/{id}/approve")
    @Operation(summary = "POST: Duyệt ngựa hệ thống", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.approveSystemHorse()` -> `AdminUserService.approveSystemHorse()`")
    public ResponseEntity<?> approveSystemHorse(@PathVariable Integer id) {
        try {
            adminUserService.approveSystemHorse(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/system-horse/{id}/reject")
    @Operation(summary = "POST: Từ chối ngựa hệ thống", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.rejectSystemHorse()` -> `AdminUserService.rejectSystemHorse()`")
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
    @Operation(summary = "POST: Tự động sắp xếp cổng xuất phát", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.autoAssignGates()` -> `AdminUserService.autoAssignGates()`")
    public ResponseEntity<?> autoAssignGates(@PathVariable Integer raceId) {
        try {
            adminUserService.autoAssignGates(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Gates successfully auto-assigned."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/auto-calculate-weights")
    @Operation(summary = "POST: Tự động tính toán tạ gánh chì (Handicap Weight)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.autoCalculateWeights()` -> `AdminUserService.autoCalculateWeights()`")
    public ResponseEntity<?> autoCalculateWeights(@PathVariable Integer raceId) {
        try {
            adminUserService.autoCalculateWeights(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Handicap weights auto-calculated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/racecard")
    @Operation(summary = "POST: Cập nhật thông tin thẻ đua (Racecard)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.updateRacecard()` -> `AdminUserService.updateRacecard()`")
    public ResponseEntity<?> updateRacecard(@PathVariable Integer raceId, @RequestBody List<Map<String, Object>> body) {
        try {
            adminUserService.updateRacecard(raceId, body);
            return ResponseEntity.ok(Map.of("success", true, "message", "Racecard updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/cancel")
    @Operation(summary = "POST: Hủy bỏ trận đua (Admin)", description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n📌 **Code Architecture**: `AdminUserController.cancelRace()` -> `AdminUserService.cancelRace()`")
    public ResponseEntity<?> cancelRace(@PathVariable Integer raceId) {
        try {
            adminUserService.cancelRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race cancelled successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
