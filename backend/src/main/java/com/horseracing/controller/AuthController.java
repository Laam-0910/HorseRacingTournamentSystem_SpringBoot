package com.horseracing.backend.controller;

import com.horseracing.backend.dto.LoginRequestDTO;
import com.horseracing.backend.dto.LoginResponseDTO;
import com.horseracing.backend.dto.RegisterRequestDTO;
import com.horseracing.backend.dto.UserDTO;
import com.horseracing.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        LoginResponseDTO response = authService.login(request);
        if (!response.getSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/verify-login")
    public ResponseEntity<?> verifyLogin(@RequestBody Map<String, String> body) {
        String otpTxId = body.get("otpTxId");
        String otp = body.get("otp");
        LoginResponseDTO response = authService.verifyLogin(otpTxId, otp);
        if (!response.getSuccess()) {
            return ResponseEntity.badRequest().body(response);
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
        try {
            Map<String, Object> result = authService.register(request);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/verify-register")
    public ResponseEntity<?> verifyRegister(@RequestBody Map<String, String> body) {
        String otpTxId = body.get("otpTxId");
        String otp = body.get("otp");
        Map<String, Object> result = authService.verifyRegister(otpTxId, otp);
        if (Boolean.FALSE.equals(result.get("success"))) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        try {
            Map<String, Object> result = authService.forgotPassword(email);
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/verify-forgot-password")
    public ResponseEntity<?> verifyForgotPassword(@RequestBody Map<String, String> body) {
        String otpTxId = body.get("otpTxId");
        String otp = body.get("otp");
        String newPassword = body.get("newPassword");
        Map<String, Object> result = authService.verifyForgotPassword(otpTxId, otp, newPassword);
        if (Boolean.FALSE.equals(result.get("success"))) {
            return ResponseEntity.badRequest().body(result);
        }
        return ResponseEntity.ok(result);
    }

    @PostMapping("/update-profile")
    public ResponseEntity<?> updateProfile(@RequestBody UserDTO userDTO) {
        try {
            UserDTO updated = authService.updateProfile(userDTO);
            return ResponseEntity.ok(Map.of("success", true, "user", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/toggle-otp")
    public ResponseEntity<?> toggleOtp(@RequestBody Map<String, Object> request) {
        String username = (String) request.get("username");
        Boolean requireOtp = (Boolean) request.get("requireOtp");
        try {
            Boolean result = authService.toggleOtp(username, requireOtp);
            return ResponseEntity.ok(Map.of("success", true, "requireOtp", result));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
