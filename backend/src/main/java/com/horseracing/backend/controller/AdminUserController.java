package com.horseracing.backend.controller;

import com.horseracing.backend.dto.*;
import com.horseracing.backend.service.AdminUserService;
import com.horseracing.backend.service.RaceService;
import com.horseracing.backend.service.SystemConfigService;
import com.horseracing.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Controller AdminUserController - Lớp kiểm soát các endpoint nghiệp vụ của Quản trị viên (Admin).
 * - Quản lý tài khoản (Xem danh sách người dùng, tạo tài khoản thủ công, cập nhật thông tin và khóa/mở khóa tài khoản).
 * - Phân công Trọng tài vào các trận đua và hủy phân công.
 * - Xem danh sách Trọng tài đang phụ trách các trận đấu.
 * - Cập nhật link Youtube livestream phát sóng trực tiếp trận đua.
 * - Quản lý các đơn đăng ký (ngựa, chủ ngựa, kỵ sĩ, phiếu tham gia trận đua) đang ở trạng thái PENDING.
 * - Phê duyệt hoặc từ chối đơn đăng ký.
 * - Tự động hóa thiết lập Thẻ đua (Racecard): tự động phân bổ cổng xuất phát (gate), tự động tính cân nặng gánh chì (weight) cho chiến mã.
 * - Hủy bỏ (Cancel) trận đấu.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserService userService;
    private final SystemConfigService systemConfigService;
    private final RaceService raceService;

    // --- Quản lý Tài khoản (User Management) ---
    
    // Lấy danh sách toàn bộ người dùng trong hệ thống
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        // Truy vấn danh sách tất cả người dùng trong hệ thống từ UserService và trả về kết quả HTTP 200 OK
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // Lấy danh sách người dùng phân trang (Server-side Pagination cho dữ liệu lớn 1000+ users)
    @GetMapping("/users/paginated")
    public ResponseEntity<?> getUsersPaginated(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(userService.getUsersPaginated(page, size));
    }

    // Lấy thông tin chi tiết người dùng phân chia theo vai trò & thông tin liên quan
    @GetMapping("/users/{id}/details")
    public ResponseEntity<?> getUserDetailsCategorized(@PathVariable Integer id) {
        try {
            return ResponseEntity.ok(adminUserService.getUserDetailsCategorized(id));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Tạo mới thủ công tài khoản người dùng (chỉ Admin)
    @PostMapping("/users")
        public ResponseEntity<?> createUser(@RequestBody CreateUserRequestDTO body) {
        try {
            // Gọi hàm khởi tạo người dùng mới thủ công ở tầng UserService với thông tin đầu vào
            UserDTO created = userService.createUserManual(
                    body.getUsername(), // Tên đăng nhập tài khoản
                    body.getEmail(), // Địa chỉ email
                    body.getPassword(), // Mật khẩu chưa mã hóa
                    body.getRoleId(), // Mã vai trò (Admin=1, Owner=2, Jockey=3, Referee=4...)
                    body.getWeight() // Cân nặng (dành riêng cho Nài ngựa)
            );
            // Khởi tạo thành công: Trả về kết quả JSON chứa thông tin user mới khởi tạo cùng HTTP status 200 OK
            return ResponseEntity.ok(Map.of("success", true, "user", created));
        } catch (Exception e) {
            // Bắt lỗi nếu trùng tên tài khoản/email hoặc dữ liệu không hợp lệ, trả về HTTP status 400 Bad Request
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Cập nhật thông tin chi tiết của người dùng
    @PostMapping("/users/{id}")
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

    // Khóa hoặc mở khóa trạng thái tài khoản của người dùng (ACTIVE / INACTIVE)
    @PostMapping("/users/{id}/toggle")
        public ResponseEntity<?> toggleUserStatus(@PathVariable Integer id) {
        try {
            String status = userService.toggleUserStatus(id);
            return ResponseEntity.ok(Map.of("success", true, "status", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- Quản lý phân công Trọng tài (Race & Referee Assignment) ---
    
    // Gán một Trọng tài chịu trách nhiệm giám sát trận đua
    @PostMapping("/races/{raceId}/referee")
        public ResponseEntity<?> assignReferee(@PathVariable Integer raceId, @RequestBody AssignRefereeRequestDTO body) {
        try {
            adminUserService.assignReferee(raceId, body.getRefereeId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Hủy phân công nhiệm vụ giám sát của Trọng tài trong trận đua
    @PostMapping("/races/{raceId}/referee/remove")
        public ResponseEntity<?> removeReferee(@PathVariable Integer raceId, @RequestBody AssignRefereeRequestDTO body) {
        try {
            adminUserService.removeReferee(raceId, body.getRefereeId());
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Lấy sơ đồ chi tiết các Trọng tài đang giám sát từng trận đua
    @GetMapping("/races/referees")
        public ResponseEntity<?> getRaceReferees() {
        return ResponseEntity.ok(adminUserService.getRaceRefereesMap());
    }

    // --- Quản lý Livestream ---
    
    // Cập nhật đường dẫn URL livestream phát sóng trận đua
    @PostMapping("/races/{raceId}/live")
        public ResponseEntity<?> setLiveUrl(@PathVariable Integer raceId, @RequestBody UpdateLiveUrlRequestDTO body) {
        try {
            raceService.updateRace(raceId, Map.of("youtubeLiveUrl", body.getYoutubeLiveUrl()));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Gỡ bỏ đường dẫn Youtube livestream của trận đua
    @PostMapping("/races/{raceId}/live/remove")
        public ResponseEntity<?> removeLiveUrl(@PathVariable Integer raceId) {
        try {
            raceService.updateRace(raceId, Map.of("youtubeLiveUrl", ""));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- Cấu hình Tham số vận hành (System Config) ---
    
    // Xem danh sách cấu hình tham số hệ thống hiện tại
    @GetMapping("/configs")
        public ResponseEntity<List<SystemConfigDTO>> getConfigs() {
        return ResponseEntity.ok(systemConfigService.getAllConfigs());
    }

    // Ghi nhận cập nhật các cấu hình tham số hệ thống mới
    @PostMapping("/configs")
        public ResponseEntity<?> updateConfigs(@RequestBody Map<String, String> body) {
        try {
            systemConfigService.updateConfigs(body);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- Quản lý Phê duyệt Đơn đăng ký (Registrations & Approvals) ---
    
    // Tải toàn bộ đơn đăng ký tham gia Ngày đua đang chờ duyệt (kỵ sĩ, chủ ngựa, chiến mã)
    @GetMapping("/pending-registrations")
        public ResponseEntity<?> getPendingRegistrations() {
        try {
            Map<String, Object> pending = adminUserService.getPendingRegistrations();
            return ResponseEntity.ok(pending);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Duyệt đơn tham gia trận đua (RaceEntry) của chiến mã và kỵ sĩ
    @PostMapping("/entries/{id}/approve")
        public ResponseEntity<?> approveRaceEntry(@PathVariable Integer id) {
        try {
            adminUserService.approveRaceEntry(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Từ chối đơn tham gia trận đua
    @PostMapping("/entries/{id}/reject")
        public ResponseEntity<?> rejectRaceEntry(@PathVariable Integer id) {
        try {
            adminUserService.rejectRaceEntry(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Duyệt hồ sơ kỵ sĩ (Jockey) đăng ký tham gia Ngày hội đua
    @PostMapping("/jockey-reg/{id}/approve")
        public ResponseEntity<?> approveJockeyReg(@PathVariable Integer id) {
        try {
            adminUserService.approveJockeyReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Từ chối hồ sơ kỵ sĩ đăng ký tham gia Ngày hội đua
    @PostMapping("/jockey-reg/{id}/reject")
        public ResponseEntity<?> rejectJockeyReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectJockeyReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Duyệt hồ sơ chủ ngựa (Owner) đăng ký tham gia Ngày hội đua
    @PostMapping("/owner-reg/{id}/approve")
        public ResponseEntity<?> approveOwnerReg(@PathVariable Integer id) {
        try {
            adminUserService.approveOwnerReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Từ chối hồ sơ chủ ngựa đăng ký tham gia Ngày hội đua
    @PostMapping("/owner-reg/{id}/reject")
        public ResponseEntity<?> rejectOwnerReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectOwnerReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Duyệt hồ sơ ngựa đua đăng ký tham gia Ngày hội đua
    @PostMapping("/horse-reg/{id}/approve")
        public ResponseEntity<?> approveHorseReg(@PathVariable Integer id) {
        try {
            adminUserService.approveHorseReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Từ chối hồ sơ ngựa đua đăng ký tham gia Ngày hội đua
    @PostMapping("/horse-reg/{id}/reject")
        public ResponseEntity<?> rejectHorseReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectHorseReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Duyệt hồ sơ ngựa đua khai báo ban đầu để đưa vào hệ thống quản lý
    @PostMapping("/system-horse/{id}/approve")
        public ResponseEntity<?> approveSystemHorse(@PathVariable Integer id) {
        try {
            adminUserService.approveSystemHorse(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Từ chối hồ sơ ngựa đua khai báo ban đầu
    @PostMapping("/system-horse/{id}/reject")
        public ResponseEntity<?> rejectSystemHorse(@PathVariable Integer id) {
        try {
            adminUserService.rejectSystemHorse(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- Tự động thiết lập Thẻ đua (Racecard Automation) ---
    
    // Tự động phân bổ ngẫu nhiên cổng xuất phát cho ngựa đua (1st gate, 2nd gate...)
    @PostMapping("/races/{raceId}/auto-assign-gates")
        public ResponseEntity<?> autoAssignGates(@PathVariable Integer raceId) {
        try {
            adminUserService.autoAssignGates(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Gates successfully auto-assigned."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Tự động tính toán số cân nặng gánh thêm (Handicap assignedWeight) dựa trên Rating ngựa
    @PostMapping("/races/{raceId}/auto-calculate-weights")
        public ResponseEntity<?> autoCalculateWeights(@PathVariable Integer raceId) {
        try {
            adminUserService.autoCalculateWeights(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Handicap weights auto-calculated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Cập nhật thủ công các thông số Thẻ đua (Racecard) như cổng xuất phát hay trọng lượng gánh
    @PostMapping("/races/{raceId}/racecard")
        public ResponseEntity<?> updateRacecard(@PathVariable Integer raceId, @RequestBody List<Map<String, Object>> body) {
        try {
            adminUserService.updateRacecard(raceId, body);
            return ResponseEntity.ok(Map.of("success", true, "message", "Racecard updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Hủy bỏ trận đua (Trạng thái đổi sang CANCELLED)
    @PostMapping("/races/{raceId}/cancel")
        public ResponseEntity<?> cancelRace(@PathVariable Integer raceId) {
        try {
            adminUserService.cancelRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race cancelled successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Nạp tiền vào ví của người dùng
    @PostMapping("/users/{userId}/deposit")
    public ResponseEntity<?> depositUserWallet(@PathVariable Integer userId, @RequestBody Map<String, Object> request) {
        try {
            Object amtObj = request.get("amount");
            if (amtObj == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Amount is required"));
            }
            java.math.BigDecimal amount = new java.math.BigDecimal(amtObj.toString());
            UserDTO updatedUser = adminUserService.depositWalletBalance(userId, amount);
            return ResponseEntity.ok(Map.of("success", true, "message", "Wallet deposit successful", "user", updatedUser));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
