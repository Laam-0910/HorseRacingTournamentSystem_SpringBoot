package com.horseracing.backend.controller;

import com.horseracing.backend.dto.*;
import com.horseracing.backend.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(
    name = "01. Auth & Security Service",
    description = "🔐 **BƯỚC 1: XÁC THỰC & BẢO MẬT HỆ THỐNG (SECURITY ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `AuthController.java`\n" +
                  "* **Services**: `AuthService.java`, `EmailSender.java`\n" +
                  "* **Security Config**: `SecurityConfig.java`, `JwtTokenProvider.java`, `JwtAuthenticationFilter.java`, `PasswordEncoder` (BCrypt)\n" +
                  "* **Repositories**: `UserRepository.java`\n" +
                  "* **Entities**: `User.java` (RoleId, PasswordHash, Status, RequireOtp...)\n" +
                  "* **DTOs**: `LoginRequestDTO.java`, `LoginResponseDTO.java`, `RegisterRequestDTO.java`, `VerifyOtpRequestDTO.java`...\n" +
                  "* **Frontend**: `Login.tsx`, `Register.tsx`, `VerifyLogin.tsx`, `VerifyRegister.tsx`, `ForgotPassword.tsx`, `VerifyForgot.tsx`, `AuthContext.tsx`, `authService.ts`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Đăng ký tài khoản mới -> Mã hóa mật khẩu BCrypt -> Gửi mã OTP xác nhận về Email -> Kích hoạt User.\n" +
                  "2. Đăng nhập hệ thống (Username/Email + Password) -> Kiểm tra status tài khoản -> Khởi tạo chuỗi JWT Bearer Token.\n" +
                  "3. Nếu bật OTP 2FA: Trả về yêu cầu nhập OTP trước khi phát hành Token chính thức.\n" +
                  "4. Quên mật khẩu: Gửi OTP xác nhận qua Email -> Đặt lại mật khẩu mới đã mã hóa."
)
public class AuthController {

    private final AuthService authService; // Dịch vụ xác thực tài khoản

    // Đăng nhập vào hệ thống
    @PostMapping("/login")
    @Operation(
        summary = "POST: Đăng nhập hệ thống & lấy JWT Bearer Token",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AuthController.login()`\n" +
                      "* **Services**: `AuthService.login()`, `JwtTokenProvider.generateToken()`, `PasswordEncoder.matches()`\n" +
                      "* **Repositories**: `UserRepository.findByUsernameOrEmail()`\n" +
                      "* **Entities**: `User.java`\n" +
                      "* **DTOs**: `LoginRequestDTO` (`usernameOrEmail`, `password`), `LoginResponseDTO` (`token`, `user`, `requireOtp`, `otpTxId`)\n" +
                      "* **DTO Request**: `LoginRequestDTO` (`usernameOrEmail`, `password`)\n" +
                      "* **DTO Response**: `LoginResponseDTO` (`success`, `token`, `user`, `requireOtp`, `otpTxId`, `message`)\n" +
                      "* **Frontend**: `Login.tsx` (auth), `authService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận payload `LoginRequestDTO` từ client.\n" +
                      "2. Tìm kiếm `User` trong DB theo Username hoặc Email.\n" +
                      "3. Kiểm tra Mật khẩu mã hóa BCrypt xem có trùng khớp không.\n" +
                      "4. Nếu User bật 2FA (`requireOtp = true`): Tạo giao dịch OTP, gửi Email và yêu cầu nhập OTP tiếp theo.\n" +
                      "5. Nếu không bật 2FA: Phát hành chuỗi `JWT Bearer Token` (`JwtTokenProvider.generateToken()`) và trả về thông tin User."
    )
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
    @Operation(
        summary = "POST: Xác thực OTP 2FA khi đăng nhập",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AuthController.verifyLogin()`\n" +
                      "* **Services**: `AuthService.verifyLogin()`, `JwtTokenProvider.generateToken()`\n" +
                      "* **Repositories**: `UserRepository.findByUsername()`\n" +
                      "* **Entities**: `User.java`\n" +
                      "* **DTOs**: `VerifyOtpRequestDTO` (`otpTxId`, `otp`), `LoginResponseDTO` (`token`, `user`)\n" +
                      "* **DTO Request**: `VerifyOtpRequestDTO` (`otpTxId`, `otp`)\n" +
                      "* **DTO Response**: `LoginResponseDTO` (`success`, `token`, `user`, `message`)\n" +
                      "* **Frontend**: `VerifyLogin.tsx` (auth), `authService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tiếp nhận Mã giao dịch OTP (`otpTxId`) và Mã OTP 6 chữ số từ Client.\n" +
                      "2. Kiểm tra tính hợp lệ và thời hạn của OTP trong bộ nhớ Session/Cache.\n" +
                      "3. Nếu hợp lệ: Phát hành chuỗi JWT Bearer Token chính thức cho người dùng."
    )
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
    @Operation(
        summary = "POST: Đăng ký tài khoản người dùng mới",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AuthController.register()`\n" +
                      "* **Services**: `AuthService.register()`, `EmailSender.sendOtpEmail()`\n" +
                      "* **Repositories**: `UserRepository.save()`\n" +
                      "* **Entities**: `User.java`\n" +
                      "* **DTOs**: `RegisterRequestDTO` (`username`, `email`, `password`, `roleId`), `Map<String, Object>` (`{\"success\": true, \"otpTxId\": \"...\"}`)\n" +
                      "* **DTO Request**: `RegisterRequestDTO` (`username`, `email`, `password`, `roleId`, `fullName`, `phoneNumber`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`success`, `otpTxId`, `message`)\n" +
                      "* **Frontend**: `Register.tsx` (auth), `authService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra Username hoặc Email xem đã tồn tại trong DB chưa.\n" +
                      "2. Mã hóa mật khẩu bằng BCryptPasswordEncoder.\n" +
                      "3. Khởi tạo đối tượng `User` ở trạng thái `PENDING_OTP`.\n" +
                      "4. Tạo mã OTP ngẫu nhiên và gửi về Email đăng ký của người dùng."
    )
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
    @Operation(
        summary = "POST: Xác thực OTP đăng ký tài khoản",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AuthController.verifyRegister()`\n" +
                      "* **Services**: `AuthService.verifyRegister()`\n" +
                      "* **Repositories**: `UserRepository.save()`\n" +
                      "* **Entities**: `User.java` (Status: PENDING_OTP -> ACTIVE)\n" +
                      "* **DTOs**: `VerifyOtpRequestDTO` (`otpTxId`, `otp`)\n" +
                      "* **DTO Request**: `VerifyOtpRequestDTO` (`otpTxId`, `otp`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`success`, `message`)\n" +
                      "* **Frontend**: `VerifyRegister.tsx` (auth), `authService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra mã OTP khớp với giao dịch đăng ký `otpTxId`.\n" +
                      "2. Chuyển trạng thái `User` từ `PENDING_OTP` sang `ACTIVE`.\n" +
                      "3. Hoàn tất quá trình kích hoạt tài khoản."
    )
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
    @Operation(
        summary = "POST: Yêu cầu mã OTP khôi phục Quên mật khẩu",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AuthController.forgotPassword()`\n" +
                      "* **Services**: `AuthService.forgotPassword()`, `EmailSender.sendOtpEmail()`\n" +
                      "* **Repositories**: `UserRepository.findByEmail()`\n" +
                      "* **Entities**: `User.java`\n" +
                      "* **DTOs**: `ForgotPasswordRequestDTO` (`email`)\n" +
                      "* **DTO Request**: `ForgotPasswordRequestDTO` (`email`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`success`, `otpTxId`, `message`)\n" +
                      "* **Frontend**: `ForgotPassword.tsx` (auth), `authService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tìm `User` theo Email yêu cầu.\n" +
                      "2. Tạo mã OTP khôi phục mật khẩu và gửi về Email của User."
    )
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
    @Operation(
        summary = "POST: Xác thực OTP và đặt lại mật khẩu mới",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AuthController.verifyForgotPassword()`\n" +
                      "* **Services**: `AuthService.verifyForgotPassword()`\n" +
                      "* **Repositories**: `UserRepository.save()`\n" +
                      "* **Entities**: `User.java`\n" +
                      "* **DTOs**: `VerifyForgotPasswordRequestDTO` (`otpTxId`, `otp`, `newPassword`)\n" +
                      "* **DTO Request**: `VerifyForgotPasswordRequestDTO` (`otpTxId`, `otp`, `newPassword`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`success`, `message`)\n" +
                      "* **Frontend**: `VerifyForgot.tsx` (auth), `authService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Kiểm tra OTP khôi phục mật khẩu hợp lệ.\n" +
                      "2. Mã hóa `newPassword` bằng BCrypt và cập nhật cột `passwordHash` trong bảng `User`."
    )
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
    @Operation(
        summary = "POST: Cập nhật thông tin trang cá nhân",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AuthController.updateProfile()`\n" +
                      "* **Services**: `AuthService.updateProfile()`\n" +
                      "* **Repositories**: `UserRepository.save()`\n" +
                      "* **Entities**: `User.java`\n" +
                      "* **DTOs**: `UserDTO` (`email`, `avatar`, `biography`, `weight`)\n" +
                      "* **DTO Request**: `UserDTO` (`email`, `avatar`, `biography`, `weight`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`success`, `user`)\n" +
                      "* **Frontend**: `ProfileModal.tsx`, `ProfileTab.tsx`, `authService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Xác thực thông tin người dùng từ SecurityContext.\n" +
                      "2. Cập nhật Avatar, Tiểu sử, Email hoặc Cân nặng vào DB."
    )
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
    @Operation(
        summary = "POST: Bật/Tắt xác thực OTP 2FA",
        description = "📝 **CẤU TRÚC CODE & LUỒNG XỬ LÝ POST API:**\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controllers**: `AuthController.toggleOtp()`\n" +
                      "* **Services**: `AuthService.toggleOtp()`\n" +
                      "* **Repositories**: `UserRepository.save()`\n" +
                      "* **Entities**: `User.java` (`requireOtp`)\n" +
                      "* **DTOs**: `ToggleOtpRequestDTO` (`username`, `requireOtp`)\n" +
                      "* **DTO Request**: `ToggleOtpRequestDTO` (`username`, `requireOtp`)\n" +
                      "* **DTO Response**: `Map<String, Object>` (`success`, `requireOtp`)\n" +
                      "* **Frontend**: `ProfileTab.tsx`, `authService.ts`\n\n" +
                      "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ DETAILED:**\n" +
                      "1. Tìm `User` trong DB theo `username`.\n" +
                      "2. Đổi giá trị trường `requireOtp` thành `true` hoặc `false`."
    )
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
