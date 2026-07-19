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
    name = "Auth Service",
    description = "🔐 **Cấu trúc Mô-đun Xác Thực & Bảo Mật Nguồn (Security Architecture)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `AuthController.java`\n" +
                  "* **Services**: `AuthService.java` (`AuthServiceImpl.java`), `JwtAuthenticationFilter.java`, `EmailSender.java`\n" +
                  "* **Security Config**: `SecurityConfig.java`, `JwtTokenProvider.java`, `PasswordEncoder` (BCrypt)\n" +
                  "* **Repositories**: `UserRepository.java`\n" +
                  "* **Entities**: `User.java` (gồm RoleId, PasswordHash, Status, RequireOtp...)\n" +
                  "* **DTOs**: `LoginRequestDTO.java`, `LoginResponseDTO.java`, `RegisterRequestDTO.java`, `VerifyOtpRequestDTO.java`...\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Đăng ký tài khoản mới -> Mã hóa mật khẩu BCrypt -> Gửi mã OTP xác nhận về Email -> Kích hoạt `User`.\n" +
                  "2. Đăng nhập hệ thống (Username/Email + Password) -> Kiểm tra status tài khoản -> Khởi tạo chuỗi JWT Bearer Token.\n" +
                  "3. Nếu bật OTP 2FA: Trả về yêu cầu nhập OTP trước khi phát hành Token chính thức.\n" +
                  "4. Quên mật khẩu: Gửi OTP xác nhận qua Email -> Đặt lại mật khẩu mới đã mã hóa."
)
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống", description = "📌 **Code Architecture**: `AuthController.login()` -> `AuthService.login()` -> Kiểm tra BCrypt password -> `JwtTokenProvider.generateToken()` -> Trả về `LoginResponseDTO` với JWT Bearer Token")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        if (!response.getSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-login")
    @Operation(summary = "Xác thực OTP khi đăng nhập", description = "📌 **Code Architecture**: `AuthController.verifyLogin()` -> `AuthService.verifyLogin()` -> Kiểm tra mã OTP trong Session Memory -> Phát hành JWT Token")
    public ResponseEntity<?> verifyLogin(@RequestBody VerifyOtpRequestDTO body) {
        LoginResponseDTO response = authService.verifyLogin(body.getOtpTxId(), body.getOtp());
        if (!response.getSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới", description = "📌 **Code Architecture**: `AuthController.register()` -> `AuthService.register()` -> Mã hóa BCrypt password -> Gửi Email OTP -> Trả về `otpTxId`")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
        try {
            Map<String, Object> result = authService.register(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/verify-register")
    @Operation(summary = "Xác thực OTP đăng ký tài khoản", description = "📌 **Code Architecture**: `AuthController.verifyRegister()` -> `AuthService.verifyRegister()` -> Xác thực OTP -> Đổi status user sang `ACTIVE`")
    public ResponseEntity<?> verifyRegister(@RequestBody VerifyOtpRequestDTO body) {
        Map<String, Object> result = authService.verifyRegister(body.getOtpTxId(), body.getOtp());
        if (Boolean.FALSE.equals(result.get("success"))) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Yêu cầu mã OTP cho Quên mật khẩu", description = "📌 **Code Architecture**: `AuthController.forgotPassword()` -> `AuthService.forgotPassword()` -> Tạo OTP và gửi tới Email người dùng")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequestDTO body) {
        try {
            Map<String, Object> result = authService.forgotPassword(body.getEmail());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/verify-forgot-password")
    @Operation(summary = "Xác thực OTP và đặt lại mật khẩu mới", description = "📌 **Code Architecture**: `AuthController.verifyForgotPassword()` -> `AuthService.verifyForgotPassword()` -> Đặt lại `passwordHash` mới")
    public ResponseEntity<?> verifyForgotPassword(@RequestBody VerifyForgotPasswordRequestDTO body) {
        Map<String, Object> result = authService.verifyForgotPassword(body.getOtpTxId(), body.getOtp(), body.getNewPassword());
        if (Boolean.FALSE.equals(result.get("success"))) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/update-profile")
    @Operation(summary = "Cập nhật thông tin trang cá nhân", description = "📌 **Code Architecture**: `AuthController.updateProfile()` -> `AuthService.updateProfile()` -> Cập nhật thông tin User trong DB")
    public ResponseEntity<?> updateProfile(@RequestBody UserDTO userDTO) {
        try {
            UserDTO updated = authService.updateProfile(userDTO);
            return ResponseEntity.ok(Map.of("success", true, "user", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/toggle-otp")
    @Operation(summary = "Bật/Tắt xác thực OTP 2FA", description = "📌 **Code Architecture**: `AuthController.toggleOtp()` -> `AuthService.toggleOtp()` -> Đổi giá trị `requireOtp` trong User entity")
    public ResponseEntity<?> toggleOtp(@RequestBody ToggleOtpRequestDTO request) {
        try {
            Boolean result = authService.toggleOtp(request.getUsername(), request.getRequireOtp());
            return ResponseEntity.ok(Map.of("success", true, "requireOtp", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
