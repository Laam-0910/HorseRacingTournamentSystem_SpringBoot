package com.horseracing.backend.controller;

import com.horseracing.backend.dto.*;
import com.horseracing.backend.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Controller AuthController - Lớp kiểm soát các endpoint bảo mật hệ thống và xác thực người dùng.
 * - Đăng nhập tài khoản bằng tên đăng nhập/email và mật khẩu, cấp mã JWT Token.
 * - Xác thực 2 lớp qua mã giao dịch OTP 2FA (Double-factor authentication).
 * - Đăng ký tài khoản mới và xác nhận kích hoạt bằng mã OTP gửi về Email.
 * - Khôi phục mật khẩu (Quên mật khẩu) thông qua mã xác thực OTP.
 * - Thay đổi cấu hình thông tin cá nhân (Avatar, Tiểu sử, Cân nặng...).
 * - Bật/Tắt chế độ xác thực OTP khi đăng nhập.
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Hỗ trợ CORS
public class AuthController {

    private final AuthService authService; // Dịch vụ xác thực tài khoản

    // Đăng nhập vào hệ thống
    @PostMapping("/login")
        public ResponseEntity<?> login(@RequestBody LoginRequestDTO request) {
        // Gọi hàm đăng nhập từ tầng dịch vụ AuthService với thông tin tên đăng nhập/email và mật khẩu
        LoginResponseDTO response = authService.login(request);
        // Kiểm tra xem tiến trình đăng nhập có trả về lỗi hay không
        if (!response.getSuccess()) {
            // Nếu thất bại (sai mật khẩu hoặc tài khoản chưa kích hoạt), trả về phản hồi lỗi HTTP status 400 Bad Request
            return ResponseEntity.badRequest().body(response);
        }
        // Nếu đăng nhập thành công, trả về phản hồi HTTP status 200 OK cùng dữ liệu User và mã Token
        return ResponseEntity.ok(response);
    }

    // Xác thực mã OTP 2FA sau khi nhập đúng tên đăng nhập/mật khẩu
    @PostMapping("/verify-login")
        public ResponseEntity<?> verifyLogin(@RequestBody VerifyOtpRequestDTO body) {
        // Thực thi kiểm tra mã OTP 2FA với mã giao dịch ở tầng dịch vụ AuthService
        LoginResponseDTO response = authService.verifyLogin(body.getOtpTxId(), body.getOtp());
        // Nếu mã OTP nhập sai hoặc đã hết thời gian hiệu lực
        if (!response.getSuccess()) {
            // Trả về kết quả từ chối với HTTP status 400 Bad Request
            return ResponseEntity.badRequest().body(response);
        }
        // Mã OTP đúng: Trả về kết quả thành công HTTP status 200 OK cùng chuỗi JWT Bearer Token
        return ResponseEntity.ok(response);
    }

    // Đăng ký tài khoản người dùng mới (User, Owner, Jockey, Referee...)
    @PostMapping("/register")
        public ResponseEntity<?> register(@RequestBody RegisterRequestDTO request) {
        try {
            // Đăng ký tài khoản mới và phát hành mã giao dịch OTP xác minh qua Email
            Map<String, Object> result = authService.register(request);
            // Trả về kết quả thành công HTTP status 200 OK kèm mã otpTxId
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            // Bắt ngoại lệ trùng khớp tên tài khoản/email hoặc mật khẩu yếu, trả về lỗi HTTP status 400
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Xác nhận mã OTP gửi về email để kích hoạt tài khoản vừa đăng ký
    @PostMapping("/verify-register")
        public ResponseEntity<?> verifyRegister(@RequestBody VerifyOtpRequestDTO body) {
        // Thực thi kiểm tra OTP kích hoạt tài khoản đăng ký ở tầng AuthService
        Map<String, Object> result = authService.verifyRegister(body.getOtpTxId(), body.getOtp());
        // Kiểm tra cờ thành công trong phản hồi
        if (Boolean.FALSE.equals(result.get("success"))) {
            // Nếu sai OTP, trả về lỗi HTTP status 400 Bad Request
            return ResponseEntity.badRequest().body(result);
        }
        // Kích hoạt tài khoản thành công: Trả về HTTP status 200 OK
        return ResponseEntity.ok(result);
    }

    // Gửi yêu cầu lấy mã OTP khôi phục mật khẩu
    @PostMapping("/forgot-password")
        public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequestDTO body) {
        try {
            // Gửi mã OTP khôi phục mật khẩu về email của người dùng
            Map<String, Object> result = authService.forgotPassword(body.getEmail());
            // Trả về phản hồi thành công HTTP status 200 OK
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            // Bắt ngoại lệ nếu không tìm thấy Email trong hệ thống, trả về HTTP status 400
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Xác nhận mã OTP khôi phục mật khẩu và cập nhật mật khẩu mới
    @PostMapping("/verify-forgot-password")
        public ResponseEntity<?> verifyForgotPassword(@RequestBody VerifyForgotPasswordRequestDTO body) {
        // Thực thi đặt lại mật khẩu mới với mã OTP đã gửi ở tầng AuthService
        Map<String, Object> result = authService.verifyForgotPassword(body.getOtpTxId(), body.getOtp(), body.getNewPassword());
        // Kiểm tra xem tiến trình đổi mật khẩu thành công hay không
        if (Boolean.FALSE.equals(result.get("success"))) {
            // Nếu mã OTP không đúng hoặc hết hạn, trả về lỗi HTTP status 400 Bad Request
            return ResponseEntity.badRequest().body(result);
        }
        // Đổi mật khẩu thành công: Trả về kết quả HTTP status 200 OK
        return ResponseEntity.ok(result);
    }

    // Cập nhật hồ sơ thông tin cá nhân (Avatar, Tiểu sử, Email, Cân nặng kỵ sĩ)
    @PostMapping("/update-profile")
        public ResponseEntity<?> updateProfile(@RequestBody UserDTO userDTO) {
        try {
            // Thực thi cập nhật hồ sơ cá nhân của tài khoản hiện tại ở tầng AuthService
            UserDTO updated = authService.updateProfile(userDTO);
            // Trả về dữ liệu User sau khi đã cập nhật với HTTP status 200 OK
            return ResponseEntity.ok(Map.of("success", true, "user", updated));
        } catch (Exception e) {
            // Bắt ngoại lệ hệ thống và trả về phản hồi lỗi HTTP status 400
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Bật hoặc tắt xác thực OTP khi thực hiện đăng nhập vào hệ thống
    @PostMapping("/toggle-otp")
        public ResponseEntity<?> toggleOtp(@RequestBody ToggleOtpRequestDTO request) {
        try {
            // Chuyển đổi trạng thái cấu hình OTP 2FA (bật hoặc tắt) ở tầng AuthService
            Boolean result = authService.toggleOtp(request.getUsername(), request.getRequireOtp());
            // Trả về phản hồi trạng thái mới của tính năng OTP với HTTP status 200 OK
            return ResponseEntity.ok(Map.of("success", true, "requireOtp", result));
        } catch (IllegalArgumentException e) {
            // Bắt ngoại lệ nếu không tìm thấy User, trả về lỗi HTTP status 400
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
