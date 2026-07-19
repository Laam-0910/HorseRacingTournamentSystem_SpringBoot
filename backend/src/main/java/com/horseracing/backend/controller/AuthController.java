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
@Tag(name = "Auth Service", description = "Xác thực người dùng: Đăng nhập, Đăng ký, OTP, Đổi mật khẩu")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập hệ thống", description = "📌 **Code Handler**: `AuthController.login()` | **DTO Request**: `LoginRequestDTO`")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        if (!response.getSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-login")
    @Operation(summary = "Xác thực OTP khi đăng nhập", description = "📌 **Code Handler**: `AuthController.verifyLogin()` | **DTO Request**: `VerifyOtpRequestDTO`")
    public ResponseEntity<?> verifyLogin(@RequestBody VerifyOtpRequestDTO body) {
        LoginResponseDTO response = authService.verifyLogin(body.getOtpTxId(), body.getOtp());
        if (!response.getSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản mới", description = "📌 **Code Handler**: `AuthController.register()` | **DTO Request**: `RegisterRequestDTO`")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
        try {
            Map<String, Object> result = authService.register(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/verify-register")
    @Operation(summary = "Xác thực OTP đăng ký tài khoản", description = "📌 **Code Handler**: `AuthController.verifyRegister()` | **DTO Request**: `VerifyOtpRequestDTO`")
    public ResponseEntity<?> verifyRegister(@RequestBody VerifyOtpRequestDTO body) {
        Map<String, Object> result = authService.verifyRegister(body.getOtpTxId(), body.getOtp());
        if (Boolean.FALSE.equals(result.get("success"))) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/forgot-password")
    @Operation(summary = "Yêu cầu mã OTP cho Quên mật khẩu", description = "📌 **Code Handler**: `AuthController.forgotPassword()` | **DTO Request**: `ForgotPasswordRequestDTO`")
    public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequestDTO body) {
        try {
            Map<String, Object> result = authService.forgotPassword(body.getEmail());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/verify-forgot-password")
    @Operation(summary = "Xác thực OTP và đặt lại mật khẩu mới", description = "📌 **Code Handler**: `AuthController.verifyForgotPassword()` | **DTO Request**: `VerifyForgotPasswordRequestDTO`")
    public ResponseEntity<?> verifyForgotPassword(@RequestBody VerifyForgotPasswordRequestDTO body) {
        Map<String, Object> result = authService.verifyForgotPassword(body.getOtpTxId(), body.getOtp(), body.getNewPassword());
        if (Boolean.FALSE.equals(result.get("success"))) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/update-profile")
    @Operation(summary = "Cập nhật thông tin trang cá nhân", description = "📌 **Code Handler**: `AuthController.updateProfile()` | **DTO Request**: `UserDTO`")
    public ResponseEntity<?> updateProfile(@RequestBody UserDTO userDTO) {
        try {
            UserDTO updated = authService.updateProfile(userDTO);
            return ResponseEntity.ok(Map.of("success", true, "user", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/toggle-otp")
    @Operation(summary = "Bật/Tắt xác thực OTP 2FA", description = "📌 **Code Handler**: `AuthController.toggleOtp()` | **DTO Request**: `ToggleOtpRequestDTO`")
    public ResponseEntity<?> toggleOtp(@RequestBody ToggleOtpRequestDTO request) {
        try {
            Boolean result = authService.toggleOtp(request.getUsername(), request.getRequireOtp());
            return ResponseEntity.ok(Map.of("success", true, "requireOtp", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
