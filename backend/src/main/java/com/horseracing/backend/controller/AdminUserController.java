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
    name = "Admin User Service",
    description = "🛡️ **Cấu trúc Mô-đun Quản Trị Viên Hệ Thống (System Administration Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `AdminUserController.java`\n" +
                  "* **Services**: `AdminUserService.java` (`AdminUserServiceImpl.java`), `UserService.java`, `SystemConfigService.java`, `RaceService.java`\n" +
                  "* **Repositories**: `UserRepository.java`, `HorseRepository.java`, `RaceEntryRepository.java`, `SystemConfigRepository.java`\n" +
                  "* **Entities**: `User.java`, `Horse.java`, `SystemConfig.java`, `RaceReferee.java`\n" +
                  "* **DTOs**: `CreateUserRequestDTO.java`, `UpdateUserRequestDTO.java`, `AssignRefereeRequestDTO.java`, `UpdateLiveUrlRequestDTO.java`...\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Admin quản lý toàn bộ danh sách tài khoản (Khóa/Bật tài khoản, tạo mới người dùng, chỉnh sửa thông tin).\n" +
                  "2. Xét duyệt toàn bộ đơn đăng ký thi đấu từ Chủ ngựa (`approveRaceEntry`), Nài ngựa (`approveJockeyReg`), Ngựa (`approveHorseReg`).\n" +
                  "3. Phân công Trọng tài điều hành từng trận đua cụ thể (`assignReferee`).\n" +
                  "4. Tự động hóa thẻ đua: Tự động sắp xếp cổng xuất phát (`autoAssignGates`) và tính toán tạ gánh chì (`autoCalculateWeights`).\n" +
                  "5. Cập nhật link Youtube Livestream cho khán giả theo dõi trực tiếp trận đua."
)
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserService userService;
    private final SystemConfigService systemConfigService;
    private final RaceService raceService;

    // --- User Management ---
    @GetMapping("/users")
    @Operation(summary = "Lấy danh sách tất cả người dùng", description = "📌 **Code Architecture**: `AdminUserController.getAllUsers()` -> `UserService.getAllUsers()` -> `UserRepository.findAll()` -> Trả về `List<UserDTO>`")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/users")
    @Operation(summary = "Tạo mới người dùng thủ công", description = "📌 **Code Architecture**: `AdminUserController.createUser()` -> `UserService.createUserManual()` -> Mã hóa password BCrypt và lưu `User` vào DB")
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
    @Operation(summary = "Cập nhật thông tin người dùng", description = "📌 **Code Architecture**: `AdminUserController.updateUser()` -> `UserService.updateUser()` -> Cập nhật email, roleId, requireOtp, weight")
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
    @Operation(summary = "Bật/Khóa tài khoản người dùng", description = "📌 **Code Architecture**: `AdminUserController.toggleUserStatus()` -> `UserService.toggleUserStatus()` -> Đổi status giữa `ACTIVE` và `LOCKED`")
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
    @Operation(summary = "Gán Trọng tài vào trận đua", description = "📌 **Code Architecture**: `AdminUserController.assignReferee()` -> `AdminUserService.assignReferee()` -> Lưu phân công `RaceReferee` vào DB")
    public ResponseEntity<?> assignReferee(@PathVariable Integer raceId, @RequestBody AssignRefereeRequestDTO body) {
        try {
            adminUserService.assignReferee(raceId, body.getRefereeId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/referee/remove")
    @Operation(summary = "Hủy gán Trọng tài khỏi trận đua", description = "📌 **Code Architecture**: `AdminUserController.removeReferee()` -> `AdminUserService.removeReferee()` -> Xóa bản ghi `RaceReferee` khỏi DB")
    public ResponseEntity<?> removeReferee(@PathVariable Integer raceId, @RequestBody AssignRefereeRequestDTO body) {
        try {
            adminUserService.removeReferee(raceId, body.getRefereeId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/races/referees")
    @Operation(summary = "Lấy danh sách phân công Trọng tài", description = "📌 **Code Architecture**: `AdminUserController.getRaceReferees()` -> `AdminUserService.getRaceRefereesMap()` -> Map danh sách Trọng tài theo từng trận đua")
    public ResponseEntity<?> getRaceReferees() {
        return ResponseEntity.ok(adminUserService.getRaceRefereesMap());
    }

    // --- Livestream ---
    @PostMapping("/races/{raceId}/live")
    @Operation(summary = "Cập nhật link Youtube Livestream", description = "📌 **Code Architecture**: `AdminUserController.setLiveUrl()` -> `RaceService.updateRace()` -> Lưu link Youtube Live")
    public ResponseEntity<?> setLiveUrl(@PathVariable Integer raceId, @RequestBody UpdateLiveUrlRequestDTO body) {
        try {
            raceService.updateRace(raceId, Map.of("youtubeLiveUrl", body.getYoutubeLiveUrl()));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/live/remove")
    @Operation(summary = "Xóa link Livestream", description = "📌 **Code Architecture**: `AdminUserController.removeLiveUrl()` -> `RaceService.updateRace()` -> Xóa link Livestream của trận")
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
    @Operation(summary = "Lấy cấu hình hệ thống", description = "📌 **Code Architecture**: `AdminUserController.getConfigs()` -> `SystemConfigService.getAllConfigs()` -> Lấy các tham số cấu hình hệ thống")
    public ResponseEntity<List<SystemConfigDTO>> getConfigs() {
        return ResponseEntity.ok(systemConfigService.getAllConfigs());
    }

    @PostMapping("/configs")
    @Operation(summary = "Cập nhật cấu hình hệ thống", description = "📌 **Code Architecture**: `AdminUserController.updateConfigs()` -> `SystemConfigService.updateConfigs()` -> Cập nhật các tham số hệ thống")
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
    @Operation(summary = "Lấy danh sách đơn đăng ký chờ duyệt", description = "📌 **Code Architecture**: `AdminUserController.getPendingRegistrations()` -> `AdminUserService.getPendingRegistrations()` -> Lấy các đơn `PENDING` của Nài, Chủ và Ngựa")
    public ResponseEntity<?> getPendingRegistrations() {
        try {
            Map<String, Object> pending = adminUserService.getPendingRegistrations();
            return ResponseEntity.ok(pending);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entries/{id}/approve")
    @Operation(summary = "Phê duyệt đơn đăng ký trận đua", description = "📌 **Code Architecture**: `AdminUserController.approveRaceEntry()` -> `AdminUserService.approveRaceEntry()` -> Chuyển trạng thái `RaceEntry` sang `APPROVED`")
    public ResponseEntity<?> approveRaceEntry(@PathVariable Integer id) {
        try {
            adminUserService.approveRaceEntry(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entries/{id}/reject")
    @Operation(summary = "Từ chối đơn đăng ký trận đua", description = "📌 **Code Architecture**: `AdminUserController.rejectRaceEntry()` -> `AdminUserService.rejectRaceEntry()` -> Chuyển trạng thái `RaceEntry` sang `REJECTED`")
    public ResponseEntity<?> rejectRaceEntry(@PathVariable Integer id) {
        try {
            adminUserService.rejectRaceEntry(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/jockey-reg/{id}/approve")
    @Operation(summary = "Phê duyệt đơn đăng ký Nài ngựa", description = "📌 **Code Architecture**: `AdminUserController.approveJockeyReg()` -> `AdminUserService.approveJockeyReg()` -> Duyệt đơn tham gia Ngày đua của Nài")
    public ResponseEntity<?> approveJockeyReg(@PathVariable Integer id) {
        try {
            adminUserService.approveJockeyReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/jockey-reg/{id}/reject")
    @Operation(summary = "Từ chối đơn đăng ký Nài ngựa", description = "📌 **Code Architecture**: `AdminUserController.rejectJockeyReg()` -> `AdminUserService.rejectJockeyReg()` -> Từ chối đơn Nài ngựa")
    public ResponseEntity<?> rejectJockeyReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectJockeyReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/owner-reg/{id}/approve")
    @Operation(summary = "Phê duyệt đơn đăng ký Chủ ngựa", description = "📌 **Code Architecture**: `AdminUserController.approveOwnerReg()` -> `AdminUserService.approveOwnerReg()` -> Duyệt đơn Chủ ngựa")
    public ResponseEntity<?> approveOwnerReg(@PathVariable Integer id) {
        try {
            adminUserService.approveOwnerReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/owner-reg/{id}/reject")
    @Operation(summary = "Từ chối đơn đăng ký Chủ ngựa", description = "📌 **Code Architecture**: `AdminUserController.rejectOwnerReg()` -> `AdminUserService.rejectOwnerReg()` -> Từ chối đơn Chủ ngựa")
    public ResponseEntity<?> rejectOwnerReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectOwnerReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/horse-reg/{id}/approve")
    @Operation(summary = "Phê duyệt đơn đăng ký Ngựa", description = "📌 **Code Architecture**: `AdminUserController.approveHorseReg()` -> `AdminUserService.approveHorseReg()` -> Duyệt đơn đăng ký thi đấu của con ngựa")
    public ResponseEntity<?> approveHorseReg(@PathVariable Integer id) {
        try {
            adminUserService.approveHorseReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/horse-reg/{id}/reject")
    @Operation(summary = "Từ chối đơn đăng ký Ngựa", description = "📌 **Code Architecture**: `AdminUserController.rejectHorseReg()` -> `AdminUserService.rejectHorseReg()` -> Từ chối đơn đăng ký thi đấu của con ngựa")
    public ResponseEntity<?> rejectHorseReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectHorseReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/system-horse/{id}/approve")
    @Operation(summary = "Duyệt ngựa hệ thống", description = "📌 **Code Architecture**: `AdminUserController.approveSystemHorse()` -> `AdminUserService.approveSystemHorse()` -> Duyệt hồ sơ chiến mã hệ thống")
    public ResponseEntity<?> approveSystemHorse(@PathVariable Integer id) {
        try {
            adminUserService.approveSystemHorse(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/system-horse/{id}/reject")
    @Operation(summary = "Từ chối ngựa hệ thống", description = "📌 **Code Architecture**: `AdminUserController.rejectSystemHorse()` -> `AdminUserService.rejectSystemHorse()` -> Từ chối hồ sơ chiến mã hệ thống")
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
    @Operation(summary = "Tự động sắp xếp cổng xuất phát", description = "📌 **Code Architecture**: `AdminUserController.autoAssignGates()` -> `AdminUserService.autoAssignGates()` -> Thuật toán ngẫu nhiên phân cổng 1..N cho các `RaceEntry` trong trận")
    public ResponseEntity<?> autoAssignGates(@PathVariable Integer raceId) {
        try {
            adminUserService.autoAssignGates(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Gates successfully auto-assigned."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/auto-calculate-weights")
    @Operation(summary = "Tự động tính toán tạ gánh chì (Handicap Weight)", description = "📌 **Code Architecture**: `AdminUserController.autoCalculateWeights()` -> `AdminUserService.autoCalculateWeights()` -> Tính tạ chì căn cứ theo Rating hiện tại của ngựa và quy định Hạng đua")
    public ResponseEntity<?> autoCalculateWeights(@PathVariable Integer raceId) {
        try {
            adminUserService.autoCalculateWeights(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Handicap weights auto-calculated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/racecard")
    @Operation(summary = "Cập nhật thông tin thẻ đua (Racecard)", description = "📌 **Code Architecture**: `AdminUserController.updateRacecard()` -> `AdminUserService.updateRacecard()` -> Cập nhật danh sách cổng xuất phát và tạ gánh chì thủ công")
    public ResponseEntity<?> updateRacecard(@PathVariable Integer raceId, @RequestBody List<Map<String, Object>> body) {
        try {
            adminUserService.updateRacecard(raceId, body);
            return ResponseEntity.ok(Map.of("success", true, "message", "Racecard updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/cancel")
    @Operation(summary = "Hủy bỏ trận đua (Admin)", description = "📌 **Code Architecture**: `AdminUserController.cancelRace()` -> `AdminUserService.cancelRace()` -> Đổi trạng thái trận đua sang `CANCELLED`")
    public ResponseEntity<?> cancelRace(@PathVariable Integer raceId) {
        try {
            adminUserService.cancelRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race cancelled successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
