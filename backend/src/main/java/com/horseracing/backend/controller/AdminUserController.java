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
@Tag(
    name = "09. Admin & Racecard Service",
    description = "🛡️ **BƯỚC 9: DUYỆT ĐƠN, GÁN TRỌNG TÀI & XẾP THẺ ĐUA RACECARD (ADMIN ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `AdminUserController.java`\n" +
                  "* **Services**: `AdminUserService.java`, `UserService.java`, `RaceService.java`\n" +
                  "* **Repositories**: `UserRepository.java`, `HorseRepository.java`, `RaceEntryRepository.java`\n" +
                  "* **Entities**: `User.java`, `Horse.java`, `RaceReferee.java`\n" +
                  "* **Frontend**: `Users.tsx` (admin-workflow), `RegistrationProcessing.tsx`, `Racecard.tsx` (admin-workflow), `Race.tsx`, `Admin.tsx` (dashboards), `adminService.ts`\n\n" +
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

    // --- Quản lý Tài khoản (User Management) ---
    
    // Lấy danh sách toàn bộ người dùng trong hệ thống
    @GetMapping("/users")
    @Operation(
        summary = "GET: Lấy danh sách tất cả người dùng",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.getAllUsers()`\n" +
                      "* **Services**: `UserService.getAllUsers()`\n" +
                      "* **Repositories**: `UserRepository.findAll()`\n" +
                      "* **Entities**: `User.java`\n" +
                      "* **DTOs**: `UserDTO`\n" +
                      "* **DTO Response**: `List<UserDTO>`\n" +
                      "* **Frontend**: `Users.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận yêu cầu tải danh sách tài khoản từ Admin UI (`Users.tsx`).\n" +
                      "2. Truy vấn danh sách `User` từ database qua `UserService` và trả về `List<UserDTO>`."
    )
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        // Truy vấn danh sách tất cả người dùng trong hệ thống từ UserService và trả về kết quả HTTP 200 OK
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // Tạo mới thủ công tài khoản người dùng (chỉ Admin)
    @PostMapping("/users")
    @Operation(
        summary = "POST: Tạo mới người dùng thủ công",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.createUser()`\n" +
                      "* **Services**: `UserService.createUserManual()`\n" +
                      "* **Repositories**: `UserRepository.save()`\n" +
                      "* **Entities**: `User.java`\n" +
                      "* **DTOs**: `CreateUserRequestDTO` (`username`, `email`, `password`, `roleId`, `weight`)\n" +
                      "* **DTO Request**: `CreateUserRequestDTO` (`username`, `email`, `password`, `roleId`, `weight`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"user\": UserDTO}`)\n" +
                      "* **Frontend**: `Users.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin nhập thông tin tài khoản mới từ Modal trên giao diện `Users.tsx`.\n" +
                      "2. `UserService` mã hóa mật khẩu BCrypt, tạo bản ghi `User` mới và lưu vào CSDL."
    )
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
    @Operation(
        summary = "POST: Cập nhật thông tin người dùng",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.updateUser()`\n" +
                      "* **Services**: `UserService.updateUser()`\n" +
                      "* **Repositories**: `UserRepository.save()`\n" +
                      "* **Entities**: `User.java`\n" +
                      "* **DTOs**: `UpdateUserRequestDTO` (`username`, `email`, `roleId`, `requireOtp`, `weight`)\n" +
                      "* **DTO Request**: `UpdateUserRequestDTO` (`username`, `email`, `roleId`, `requireOtp`, `weight`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"user\": UserDTO}`)\n" +
                      "* **Frontend**: `UserEdit.tsx`, `Users.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Admin cập nhật thông tin người dùng (username, email, role, weight) từ giao diện `Users.tsx`.\n" +
                      "2. `UserService` kiểm tra dữ liệu và lưu lại thông tin cập nhật vào CSDL."
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

    // Khóa hoặc mở khóa trạng thái tài khoản của người dùng (ACTIVE / INACTIVE)
    @PostMapping("/users/{id}/toggle")
    @Operation(
        summary = "POST: Bật/Khóa tài khoản người dùng",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.toggleUserStatus()`\n" +
                      "* **Services**: `UserService.toggleUserStatus()`\n" +
                      "* **Repositories**: `UserRepository.save()`\n" +
                      "* **Entities**: `User.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"status\": \"ACTIVE/INACTIVE\"}`)\n" +
                      "* **Frontend**: `Users.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Bấm nút Khóa/Mở khóa trên danh sách người dùng ở giao diện `Users.tsx`.\n" +
                      "2. Đổi trạng thái tài khoản giữa `ACTIVE` và `INACTIVE`."
    )
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
    @Operation(
        summary = "POST: Gán Trọng tài vào trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.assignReferee()`\n" +
                      "* **Services**: `AdminUserService.assignReferee()`\n" +
                      "* **Repositories**: `RaceRefereeRepository.save()`\n" +
                      "* **Entities**: `RaceReferee.java`\n" +
                      "* **DTOs**: `AssignRefereeRequestDTO` (`refereeId`)\n" +
                      "* **DTO Request**: `AssignRefereeRequestDTO` (`refereeId`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `Race.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Chọn Trọng tài và trận đua trên giao diện Quản lý Trận đua `Race.tsx`.\n" +
                      "2. Lưu bản ghi phân công vào bảng `RaceReferee`."
    )
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
    @Operation(
        summary = "POST: Hủy gán Trọng tài khỏi trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.removeReferee()`\n" +
                      "* **Services**: `AdminUserService.removeReferee()`\n" +
                      "* **Repositories**: `RaceRefereeRepository.delete()`\n" +
                      "* **Entities**: `RaceReferee.java`\n" +
                      "* **DTOs**: `AssignRefereeRequestDTO` (`refereeId`)\n" +
                      "* **DTO Request**: `AssignRefereeRequestDTO` (`refereeId`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `Race.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Hủy phân công nhiệm vụ giám sát của Trọng tài khỏi trận đua chỉ định."
    )
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
    @Operation(
        summary = "GET: Lấy danh sách phân công Trọng tài",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.getRaceReferees()`\n" +
                      "* **Services**: `AdminUserService.getRaceRefereesMap()`\n" +
                      "* **Repositories**: `RaceRefereeRepository.findAll()`\n" +
                      "* **Entities**: `RaceReferee.java`\n" +
                      "* **DTOs**: `UserDTO`\n" +
                      "* **DTO Response**: `Map<Integer, List<UserDTO>>`\n" +
                      "* **Frontend**: `Race.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Lấy danh sách phân công Trọng tài để hiển thị sơ đồ phân công trên giao diện Admin `Race.tsx`."
    )
    public ResponseEntity<?> getRaceReferees() {
        return ResponseEntity.ok(adminUserService.getRaceRefereesMap());
    }

    // --- Quản lý Livestream ---
    
    // Cập nhật đường dẫn URL livestream phát sóng trận đua
    @PostMapping("/races/{raceId}/live")
    @Operation(
        summary = "POST: Cập nhật link Youtube Livestream",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.setLiveUrl()`\n" +
                      "* **Services**: `RaceService.updateRace()`\n" +
                      "* **Repositories**: `RaceRepository.save()`\n" +
                      "* **Entities**: `Race.java`\n" +
                      "* **DTOs**: `UpdateLiveUrlRequestDTO` (`youtubeLiveUrl`)\n" +
                      "* **DTO Request**: `UpdateLiveUrlRequestDTO` (`youtubeLiveUrl`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `LiveSettings.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Nhập đường dẫn phát trực tiếp Youtube trên giao diện `LiveSettings.tsx`.\n" +
                      "2. Lưu đường dẫn `youtubeLiveUrl` vào trận đua để hiển thị cho Khán giả xem livestream."
    )
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
    @Operation(
        summary = "POST: Xóa link Livestream",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.removeLiveUrl()`\n" +
                      "* **Services**: `RaceService.updateRace()`\n" +
                      "* **Repositories**: `RaceRepository.save()`\n" +
                      "* **Entities**: `Race.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `LiveSettings.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Xóa đường dẫn Youtube livestream của trận đua trên giao diện `LiveSettings.tsx`."
    )
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
    @Operation(
        summary = "GET: Lấy cấu hình hệ thống (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.getConfigs()`\n" +
                      "* **Services**: `SystemConfigService.getAllConfigs()`\n" +
                      "* **Repositories**: `SystemConfigRepository.findAll()`\n" +
                      "* **Entities**: `SystemConfig.java`\n" +
                      "* **DTOs**: `SystemConfigDTO`\n" +
                      "* **DTO Response**: `List<SystemConfigDTO>`\n" +
                      "* **Frontend**: `SystemConfig.tsx` (admin-workflow), `systemConfigService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Lấy toàn bộ tham số cấu hình hệ thống hiện tại cho màn hình `SystemConfig.tsx`."
    )
    public ResponseEntity<List<SystemConfigDTO>> getConfigs() {
        return ResponseEntity.ok(systemConfigService.getAllConfigs());
    }

    // Ghi nhận cập nhật các cấu hình tham số hệ thống mới
    @PostMapping("/configs")
    @Operation(
        summary = "POST: Cập nhật cấu hình hệ thống (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.updateConfigs()`\n" +
                      "* **Services**: `SystemConfigService.updateConfigs()`\n" +
                      "* **Repositories**: `SystemConfigRepository.saveAll()`\n" +
                      "* **Entities**: `SystemConfig.java`\n" +
                      "* **DTOs**: `Map<String, String>`\n" +
                      "* **DTO Request**: `Map<String, String>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `SystemConfig.tsx` (admin-workflow), `systemConfigService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Nhập và lưu các thay đổi cấu hình tham số vận hành trên giao diện `SystemConfig.tsx`."
    )
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
    @Operation(
        summary = "GET: Lấy danh sách đơn đăng ký chờ duyệt",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ GET API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.getPendingRegistrations()`\n" +
                      "* **Services**: `AdminUserService.getPendingRegistrations()`\n" +
                      "* **Repositories**: `JockeyRaceMeetingRegistrationRepository`, `OwnerRaceMeetingRegistrationRepository`, `HorseRaceMeetingRegistrationRepository`\n" +
                      "* **Entities**: `JockeyRaceMeetingRegistration.java`, `OwnerRaceMeetingRegistration.java`, `HorseRaceMeetingRegistration.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`raceEntries`, `jockeyRegs`, `ownerRegs`, `horseRegs`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tải danh sách đơn đăng ký của Nài, Chủ và Ngựa ở trạng thái `PENDING` cho màn hình `RegistrationProcessing.tsx`."
    )
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
    @Operation(
        summary = "POST: Phê duyệt đơn đăng ký trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.approveRaceEntry()`\n" +
                      "* **Services**: `AdminUserService.approveRaceEntry()`\n" +
                      "* **Repositories**: `RaceEntryRepository.save()`\n" +
                      "* **Entities**: `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Bấm Phê duyệt lượt đua trên `RegistrationProcessing.tsx`.\n" +
                      "2. Chuyển trạng thái `RaceEntry` từ `PENDING` sang `APPROVED`."
    )
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
    @Operation(
        summary = "POST: Từ chối đơn đăng ký trận đua",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.rejectRaceEntry()`\n" +
                      "* **Services**: `AdminUserService.rejectRaceEntry()`\n" +
                      "* **Repositories**: `RaceEntryRepository.save()`\n" +
                      "* **Entities**: `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Từ chối đơn đăng ký lượt đua trên `RegistrationProcessing.tsx`."
    )
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
    @Operation(
        summary = "POST: Phê duyệt đơn đăng ký Nài ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.approveJockeyReg()`\n" +
                      "* **Services**: `AdminUserService.approveJockeyReg()`\n" +
                      "* **Repositories**: `JockeyRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entities**: `JockeyRaceMeetingRegistration.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Phê duyệt hồ sơ đăng ký tham gia Ngày hội đua của Kỵ sĩ."
    )
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
    @Operation(
        summary = "POST: Từ chối đơn đăng ký Nài ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.rejectJockeyReg()`\n" +
                      "* **Services**: `AdminUserService.rejectJockeyReg()`\n" +
                      "* **Repositories**: `JockeyRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entities**: `JockeyRaceMeetingRegistration.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Từ chối hồ sơ đăng ký tham gia Ngày hội đua của Kỵ sĩ."
    )
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
    @Operation(
        summary = "POST: Phê duyệt đơn đăng ký Chủ ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.approveOwnerReg()`\n" +
                      "* **Services**: `AdminUserService.approveOwnerReg()`\n" +
                      "* **Repositories**: `OwnerRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entities**: `OwnerRaceMeetingRegistration.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Phê duyệt hồ sơ đăng ký tham gia Ngày hội đua của Chủ ngựa."
    )
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
    @Operation(
        summary = "POST: Từ chối đơn đăng ký Chủ ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.rejectOwnerReg()`\n" +
                      "* **Services**: `AdminUserService.rejectOwnerReg()`\n" +
                      "* **Repositories**: `OwnerRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entities**: `OwnerRaceMeetingRegistration.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Từ chối hồ sơ đăng ký tham gia Ngày hội đua của Chủ ngựa."
    )
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
    @Operation(
        summary = "POST: Phê duyệt đơn đăng ký Ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.approveHorseReg()`\n" +
                      "* **Services**: `AdminUserService.approveHorseReg()`\n" +
                      "* **Repositories**: `HorseRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entities**: `HorseRaceMeetingRegistration.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Phê duyệt hồ sơ chiến mã đăng ký tham gia Ngày hội đua."
    )
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
    @Operation(
        summary = "POST: Từ chối đơn đăng ký Ngựa",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.rejectHorseReg()`\n" +
                      "* **Services**: `AdminUserService.rejectHorseReg()`\n" +
                      "* **Repositories**: `HorseRaceMeetingRegistrationRepository.save()`\n" +
                      "* **Entities**: `HorseRaceMeetingRegistration.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Từ chối hồ sơ chiến mã đăng ký tham gia Ngày hội đua."
    )
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
    @Operation(
        summary = "POST: Duyệt ngựa hệ thống",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.approveSystemHorse()`\n" +
                      "* **Services**: `AdminUserService.approveSystemHorse()`\n" +
                      "* **Repositories**: `HorseRepository.save()`\n" +
                      "* **Entities**: `Horse.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `Horses.tsx`, `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Phê duyệt ngựa mới đưa vào hệ thống, đổi trạng thái sang `ACTIVE`."
    )
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
    @Operation(
        summary = "POST: Từ chối ngựa hệ thống",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.rejectSystemHorse()`\n" +
                      "* **Services**: `AdminUserService.rejectSystemHorse()`\n" +
                      "* **Repositories**: `HorseRepository.save()`\n" +
                      "* **Entities**: `Horse.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true}`)\n" +
                      "* **Frontend**: `RegistrationProcessing.tsx` (admin-workflow), `Horses.tsx`, `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Từ chối hồ sơ ngựa khai báo ban đầu."
    )
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
    @Operation(
        summary = "POST: Tự động sắp xếp cổng xuất phát",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.autoAssignGates()`\n" +
                      "* **Services**: `AdminUserService.autoAssignGates()`\n" +
                      "* **Repositories**: `RaceEntryRepository.saveAll()`\n" +
                      "* **Entities**: `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `Racecard.tsx` (admin-workflow), `adminService.ts`\n\n" +
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

    // Tự động tính toán số cân nặng gánh thêm (Handicap assignedWeight) dựa trên Rating ngựa
    @PostMapping("/races/{raceId}/auto-calculate-weights")
    @Operation(
        summary = "POST: Tự động tính toán tạ gánh chì (Handicap Weight)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.autoCalculateWeights()`\n" +
                      "* **Services**: `AdminUserService.autoCalculateWeights()`\n" +
                      "* **Repositories**: `RaceEntryRepository.saveAll()`\n" +
                      "* **Entities**: `RaceEntry.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `Racecard.tsx` (admin-workflow), `adminService.ts`\n\n" +
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

    // Cập nhật thủ công các thông số Thẻ đua (Racecard) như cổng xuất phát hay trọng lượng gánh
    @PostMapping("/races/{raceId}/racecard")
    @Operation(
        summary = "POST: Cập nhật thông tin thẻ đua (Racecard)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.updateRacecard()`\n" +
                      "* **Services**: `AdminUserService.updateRacecard()`\n" +
                      "* **Repositories**: `RaceEntryRepository.saveAll()`\n" +
                      "* **Entities**: `RaceEntry.java`\n" +
                      "* **DTOs**: `List<Map<String, Object>>`\n" +
                      "* **DTO Request**: `List<Map<String, Object>>` (`entryId`, `gateNumber`, `assignedWeight`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `Racecard.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Cập nhật thủ công các thông số Thẻ đua (cổng xuất phát `gateNumber`, tạ gánh chì `assignedWeight`)."
    )
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
    @Operation(
        summary = "POST: Hủy bỏ trận đua (Admin)",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AdminUserController.cancelRace()`\n" +
                      "* **Services**: `AdminUserService.cancelRace()`\n" +
                      "* **Repositories**: `RaceRepository.save()`\n" +
                      "* **Entities**: `Race.java`\n" +
                      "* **DTOs**: `Map<String, Object>`\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"message\": \"...\"}`)\n" +
                      "* **Frontend**: `Race.tsx` (admin-workflow), `adminService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Hủy bỏ trận đua trên giao diện `Race.tsx`, cập nhật trạng thái trận sang `CANCELLED`."
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
