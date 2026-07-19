package com.horseracing.backend.controller;

import com.horseracing.backend.dto.*;
import com.horseracing.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(
    name = "01. Auth & Security Service",
    description = "🔐 **BƯỚC 1: XÁC THỰC & BẢO MẬT HỆ THỐNG (SECURITY ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `AuthController.java`\n" +
                  "* **Services**: `AuthService.java` (`AuthServiceImpl.java`), `JwtAuthenticationFilter.java`, `EmailSender.java`\n" +
                  "* **Security Config**: `SecurityConfig.java`, `JwtTokenProvider.java`, `PasswordEncoder` (BCrypt)\n" +
                  "* **Repositories**: `UserRepository.java`\n" +
                  "* **Entities**: `User.java` (RoleId, PasswordHash, Status, RequireOtp...)\n" +
                  "* **DTOs**: `LoginRequestDTO.java`, `LoginResponseDTO.java`, `RegisterRequestDTO.java`, `VerifyOtpRequestDTO.java`...\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Đăng ký tài khoản mới -> Mã hóa mật khẩu BCrypt -> Gửi mã OTP xác nhận về Email -> Kích hoạt User.\n" +
                  "2. Đăng nhập hệ thống (Username/Email + Password) -> Kiểm tra status tài khoản -> Khởi tạo chuỗi JWT Bearer Token.\n" +
                  "3. Nếu bật OTP 2FA: Trả về yêu cầu nhập OTP trước khi phát hành Token chính thức.\n" +
                  "4. Quên mật khẩu: Gửi OTP xác nhận qua Email -> Đặt lại mật khẩu mới đã mã hóa."
)
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(
        summary = "POST: Đăng nhập hệ thống & lấy JWT Bearer Token",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AuthController.login()`\n" +
                      "* **Service**: `AuthService.login()` (`AuthServiceImpl.java`)\n" +
                      "* **Security**: `JwtTokenProvider.generateToken()`, `PasswordEncoder.matches()`\n" +
                      "* **Repository**: `UserRepository.findByUsernameOrEmail()`\n" +
                      "* **Entity**: `User.java`\n" +
                      "* **DTO Request**: `LoginRequestDTO` (`usernameOrEmail`, `password`)\n" +
                      "* **DTO Response**: `LoginResponseDTO` (`token`, `user`, `requireOtp`, `otpTxId`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận payload `LoginRequestDTO` từ client.\n" +
                      "2. Tìm kiếm `User` trong DB theo Username hoặc Email.\n" +
                      "3. Kiểm tra Mật khẩu mã hóa BCrypt xem có trùng khớp không.\n" +
                      "4. Nếu User bật 2FA (`requireOtp = true`): Tạo giao dịch OTP, gửi Email và yêu cầu nhập OTP tiếp theo.\n" +
                      "5. Nếu không bật 2FA: Phát hành chuỗi JWT Bearer Token có thời hạn và trả về thông tin User."
    )
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        if (!response.getSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-login")
    @Operation(
        summary = "POST: Xác thực OTP 2FA khi đăng nhập",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AuthController.verifyLogin()`\n" +
                      "* **Service**: `AuthService.verifyLogin()` (`AuthServiceImpl.java`)\n" +
                      "* **Security**: `JwtTokenProvider.generateToken()`\n" +
                      "* **DTO Request**: `VerifyOtpRequestDTO` (`otpTxId`, `otp`)\n" +
                      "* **DTO Response**: `LoginResponseDTO` (`token`, `user`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận Mã giao dịch OTP (`otpTxId`) và Mã OTP 6 chữ số từ Client.\n" +
                      "2. Kiểm tra tính hợp lệ và thời hạn của OTP trong bộ nhớ Session/Cache.\n" +
                      "3. Nếu hợp lệ: Phát hành chuỗi JWT Bearer Token chính thức cho người dùng."
    )
    public ResponseEntity<?> verifyLogin(@RequestBody VerifyOtpRequestDTO body) {
        LoginResponseDTO response = authService.verifyLogin(body.getOtpTxId(), body.getOtp());
        if (!response.getSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    @Operation(
        summary = "POST: Đăng ký tài khoản người dùng mới",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AuthController.register()`\n" +
                      "* **Service**: `AuthService.register()` (`AuthServiceImpl.java`)\n" +
                      "* **Notification**: `EmailSender.sendOtpEmail()`\n" +
                      "* **Repository**: `UserRepository.save()`\n" +
                      "* **Entity**: `User.java`\n" +
                      "* **DTO Request**: `RegisterRequestDTO` (`username`, `email`, `password`, `roleId`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`{\"success\": true, \"otpTxId\": \"...\"}`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra Username hoặc Email xem đã tồn tại trong DB chưa.\n" +
                      "2. Mã hóa mật khẩu bằng BCryptPasswordEncoder.\n" +
                      "3. Khởi tạo đối tượng `User` ở trạng thái `PENDING_OTP`.\n" +
                      "4. Tạo mã OTP ngẫu nhiên và gửi về Email đăng ký của người dùng."
    )
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
        try {
            Map<String, Object> result = authService.register(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/verify-register")
    @Operation(
        summary = "POST: Xác thực OTP đăng ký tài khoản",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AuthController.verifyRegister()`\n" +
                      "* **Service**: `AuthService.verifyRegister()` (`AuthServiceImpl.java`)\n" +
                      "* **Repository**: `UserRepository.save()`\n" +
                      "* **DTO Request**: `VerifyOtpRequestDTO` (`otpTxId`, `otp`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra mã OTP khớp với giao dịch đăng ký `otpTxId`.\n" +
                      "2. Chuyển trạng thái `User` từ `PENDING_OTP` sang `ACTIVE`.\n" +
                      "3. Hoàn tất quá trình kích hoạt tài khoản."
    )
    public ResponseEntity<?> verifyRegister(@RequestBody VerifyOtpRequestDTO body) {
        Map<String, Object> result = authService.verifyRegister(body.getOtpTxId(), body.getOtp());
        if (Boolean.FALSE.equals(result.get("success"))) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/forgot-password")
    @Operation(
        summary = "POST: Yêu cầu mã OTP khôi phục Quên mật khẩu",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AuthController.forgotPassword()`\n" +
                      "* **Service**: `AuthService.forgotPassword()` (`AuthServiceImpl.java`)\n" +
                      "* **Notification**: `EmailSender.sendOtpEmail()`\n" +
                      "* **DTO Request**: `ForgotPasswordRequestDTO` (`email`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tìm `User` theo Email yêu cầu.\n" +
                      "2. Tạo mã OTP khôi phục mật khẩu và gửi về Email của User."
    )
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequestDTO body) {
        try {
            Map<String, Object> result = authService.forgotPassword(body.getEmail());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/verify-forgot-password")
    @Operation(
        summary = "POST: Xác thực OTP và đặt lại mật khẩu mới",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AuthController.verifyForgotPassword()`\n" +
                      "* **Service**: `AuthService.verifyForgotPassword()` (`AuthServiceImpl.java`)\n" +
                      "* **Repository**: `UserRepository.save()`\n" +
                      "* **DTO Request**: `VerifyForgotPasswordRequestDTO` (`otpTxId`, `otp`, `newPassword`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra OTP khôi phục mật khẩu hợp lệ.\n" +
                      "2. Mã hóa `newPassword` bằng BCrypt và cập nhật cột `passwordHash` trong bảng `User`."
    )
    public ResponseEntity<?> verifyForgotPassword(@RequestBody VerifyForgotPasswordRequestDTO body) {
        Map<String, Object> result = authService.verifyForgotPassword(body.getOtpTxId(), body.getOtp(), body.getNewPassword());
        if (Boolean.FALSE.equals(result.get("success"))) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/update-profile")
    @Operation(
        summary = "POST: Cập nhật thông tin trang cá nhân",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AuthController.updateProfile()`\n" +
                      "* **Service**: `AuthService.updateProfile()` (`AuthServiceImpl.java`)\n" +
                      "* **Repository**: `UserRepository.save()`\n" +
                      "* **DTO Request**: `UserDTO` (`email`, `avatar`, `biography`, `weight`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Xác thực thông tin người dùng từ SecurityContext.\n" +
                      "2. Cập nhật Avatar, Tiểu sử, Email hoặc Cân nặng vào DB."
    )
    public ResponseEntity<?> updateProfile(@RequestBody UserDTO userDTO) {
        try {
            UserDTO updated = authService.updateProfile(userDTO);
            return ResponseEntity.ok(Map.of("success", true, "user", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/toggle-otp")
    @Operation(
        summary = "POST: Bật/Tắt xác thực OTP 2FA",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `AuthController.toggleOtp()`\n" +
                      "* **Service**: `AuthService.toggleOtp()` (`AuthServiceImpl.java`)\n" +
                      "* **Repository**: `UserRepository.save()`\n" +
                      "* **DTO Request**: `ToggleOtpRequestDTO` (`username`, `requireOtp`)\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tìm `User` trong DB theo `username`.\n" +
                      "2. Đổi giá trị trường `requireOtp` thành `true` hoặc `false`."
    )
    public ResponseEntity<?> toggleOtp(@RequestBody ToggleOtpRequestDTO request) {
        try {
            Boolean result = authService.toggleOtp(request.getUsername(), request.getRequireOtp());
            return ResponseEntity.ok(Map.of("success", true, "requireOtp", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
