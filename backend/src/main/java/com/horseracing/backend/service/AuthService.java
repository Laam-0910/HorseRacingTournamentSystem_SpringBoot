package com.horseracing.backend.service;

import com.horseracing.backend.dto.LoginRequestDTO;
import com.horseracing.backend.dto.LoginResponseDTO;
import com.horseracing.backend.dto.RegisterRequestDTO;
import com.horseracing.backend.dto.UserDTO;
import com.horseracing.backend.entity.User;
import com.horseracing.backend.mapper.UserMapper;
import com.horseracing.backend.repository.UserRepository;
import com.horseracing.backend.security.JwtTokenProvider;
import com.horseracing.backend.tool.EmailSender;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final UserMapper userMapper;
    private final EmailSender emailSender;

    @Data
    @Builder
    private static class OtpSession {
        private String otpCode;
        private long creationTime;
        private Object pendingData;
    }

    private final Map<String, OtpSession> otpStorage = new ConcurrentHashMap<>();

    @Transactional
    public LoginResponseDTO login(LoginRequestDTO request) {
        // Lấy tên đăng nhập hoặc email từ request body
        String username = request.getUsername();
        // Lấy mật khẩu nhập vào từ request body
        String password = request.getPassword();

        // 1. Tìm tài khoản người dùng theo Tên đăng nhập trong CSDL
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            // Nếu không tìm thấy theo Username, thử tìm kiếm theo địa chỉ Email
            userOpt = userRepository.findByEmail(username); // Hỗ trợ đăng nhập bằng Email
        }

        // 2. Kiểm tra nếu tài khoản hoàn toàn không tồn tại trong hệ thống
        if (userOpt.isEmpty()) {
            return LoginResponseDTO.builder()
                    .success(false) // Trả về cờ thất bại
                    .error("User not found") // Thông báo không tìm thấy tài khoản
                    .build();
        }

        // Trích xuất đối tượng User từ Optional
        User user = userOpt.get();
        // 3. Kiểm tra nếu tài khoản đang bị vô hiệu hóa (INACTIVE)
        if ("INACTIVE".equals(user.getStatus())) {
            return LoginResponseDTO.builder()
                    .success(false) // Trả về cờ thất bại
                    .error("Account is inactive") // Thông báo tài khoản bị khóa
                    .build();
        }

        boolean validPassword = false;
        // 4. Kiểm tra tương thích với mật khẩu lưu dạng văn bản thô legacy cũ (nếu chưa mã hóa BCrypt)
        if (!user.getPasswordHash().startsWith("$2a$")) {
            if (user.getPasswordHash().equals(password)) {
                validPassword = true;
                // Mã hóa lại mật khẩu cũ sang chuẩn BCrypt và cập nhật tự động vào CSDL
                user.setPasswordHash(passwordEncoder.encode(password));
                userRepository.save(user);
            }
        } else {
            // Kiểm tra khớp mật khẩu mã hóa BCrypt chuẩn
            validPassword = passwordEncoder.matches(password, user.getPasswordHash());
        }

        // 5. Nếu mật khẩu không trùng khớp
        if (!validPassword) {
            return LoginResponseDTO.builder()
                    .success(false) // Trả về cờ thất bại
                    .error("Incorrect password") // Thông báo sai mật khẩu
                    .build();
        }

        // 6. Kiểm tra xem người dùng có kích hoạt tính năng xác thực 2 lớp OTP 2FA hay không
        boolean requireOtp = (user.getRequireOtp() != null && user.getRequireOtp());

        if (!requireOtp) {
            // Nếu tắt 2FA: Phát hành ngay chuỗi JWT Bearer Token không cần qua bước OTP
            String token = tokenProvider.generateToken(user.getUsername(), user.getRoleId());
            return LoginResponseDTO.builder()
                    .success(true) // Trả về cờ thành công
                    .requireOtp(false) // Không yêu cầu nhập OTP
                    .token(token) // Chuỗi JWT Token phát hành
                    .user(userMapper.toDTO(user)) // Dữ liệu hồ sơ người dùng
                    .build();
        } else {
            // Nếu bật 2FA: Tạo ngẫu nhiên mã OTP 6 chữ số
            String otp = String.format("%06d", new Random().nextInt(999999));
            // Tạo mã định danh ngẫu nhiên cho phiên giao dịch OTP (UUID)
            String otpTxId = UUID.randomUUID().toString();
            
            // Lưu thông tin phiên xác thực OTP vào bộ nhớ tạm thời
            otpStorage.put(otpTxId, OtpSession.builder()
                    .otpCode(otp) // Mã OTP 6 chữ số
                    .creationTime(System.currentTimeMillis()) // Thời điểm tạo ngẫu nhiên
                    .pendingData(user) // Dữ liệu User tạm giữ
                    .build());

            // Gửi Email chứa mã OTP 6 chữ số về địa chỉ Email đăng ký của tài khoản
            emailSender.sendVerificationCode(user.getEmail(), otp, "LOGIN");

            // Trả về cờ yêu cầu chuyển sang màn hình nhập OTP kèm mã giao dịch otpTxId
            return LoginResponseDTO.builder()
                    .success(true) // Trả về cờ thành công khởi tạo OTP
                    .requireOtp(true) // Yêu cầu nhập OTP
                    .otpTxId(otpTxId) // Mã định danh phiên OTP
                    .build();
        }
    }

    public LoginResponseDTO verifyLogin(String otpTxId, String enteredOtp) {
        // Kiểm tra xem mã giao dịch OTP có bị thiếu hoặc rỗng không
        if (otpTxId == null || otpTxId.isBlank()) {
            return LoginResponseDTO.builder()
                    .success(false)
                    .error("Invalid or missing OTP transaction ID")
                    .build();
        }
        // Tra cứu phiên xác thực OTP trong bộ nhớ lưu trữ
        OtpSession session = otpStorage.get(otpTxId);
        // Kiểm tra phiên OTP có tồn tại và mã OTP nhập vào có trùng khớp không
        if (session == null || !session.getOtpCode().equals(enteredOtp)) {
            return LoginResponseDTO.builder()
                    .success(false)
                    .error("Invalid verification code")
                    .build();
        }

        // Kiểm tra thời gian hết hạn của mã OTP (Quá 60 giây = 60,000 miligiây)
        if ((System.currentTimeMillis() - session.getCreationTime()) > 60000) {
            // Hết hạn: Xóa phiên giao dịch khỏi bộ nhớ lưu trữ
            otpStorage.remove(otpTxId);
            return LoginResponseDTO.builder()
                    .success(false)
                    .error("Verification code has expired")
                    .build();
        }

        otpStorage.remove(otpTxId);
        User user = (User) session.getPendingData();
        String token = tokenProvider.generateToken(user.getUsername(), user.getRoleId());

        return LoginResponseDTO.builder()
                .success(true)
                .requireOtp(false)
                .token(token)
                .user(userMapper.toDTO(user))
                .build();
    }

    public Map<String, Object> register(RegisterRequestDTO request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }

        // Kiểm tra tính hợp lệ của mật khẩu ở phía Backend
        String password = request.getPassword();
        if (password == null || !password.matches("^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$")) {
            throw new IllegalArgumentException("Password must be at least 8 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character (e.g. @$!%*?&^./,#-_+)");
        }

        int roleId = request.getRoleId() != null ? request.getRoleId() : 4; // Default Spectator
        
        User pendingUser = new User();
        pendingUser.setUsername(request.getUsername());
        pendingUser.setEmail(request.getEmail());
        pendingUser.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        pendingUser.setRoleId(roleId);
        pendingUser.setWeight(request.getWeight());
        pendingUser.setStatus("ACTIVE");
        pendingUser.setTotalRacesParticipated(0);
        pendingUser.setTotalTop3Finishes(0);
        // Full name: use provided fullName or fall back to username
        String fullName = request.getFullName() != null && !request.getFullName().isBlank()
                ? request.getFullName().trim() : request.getUsername();
        pendingUser.setFullName(fullName);

        if (roleId == 1 || roleId == 5) {
            // Admin and Referee bypass email verification
            User saved = userRepository.save(pendingUser);
            return Map.of("success", true, "requireOtp", false, "user", userMapper.toDTO(saved));
        } else {
            // Generate register OTP
            String otp = String.format("%06d", new Random().nextInt(999999));
            String otpTxId = UUID.randomUUID().toString();

            otpStorage.put(otpTxId, OtpSession.builder()
                    .otpCode(otp)
                    .creationTime(System.currentTimeMillis())
                    .pendingData(pendingUser)
                    .build());

            emailSender.sendVerificationCode(request.getEmail(), otp, "REGISTER");

            return Map.of("success", true, "requireOtp", true, "otpTxId", otpTxId);
        }
    }

    @Transactional
    public Map<String, Object> verifyRegister(String otpTxId, String enteredOtp) {
        if (otpTxId == null || otpTxId.isBlank()) {
            return Map.of("success", false, "error", "Invalid or missing OTP transaction ID");
        }
        OtpSession session = otpStorage.get(otpTxId);
        if (session == null || !session.getOtpCode().equals(enteredOtp)) {
            return Map.of("success", false, "error", "Invalid verification code");
        }

        // Expire in 5 minutes (300,000 ms)
        if ((System.currentTimeMillis() - session.getCreationTime()) > 300000) {
            otpStorage.remove(otpTxId);
            return Map.of("success", false, "error", "Verification code has expired");
        }

        User pendingUser = (User) session.getPendingData();
        // Double check email is not taken in the meantime
        if (userRepository.findByEmail(pendingUser.getEmail()).isPresent()) {
            otpStorage.remove(otpTxId);
            return Map.of("success", false, "error", "Email already in use");
        }

        otpStorage.remove(otpTxId);
        User saved = userRepository.save(pendingUser);
        return Map.of("success", true, "user", userMapper.toDTO(saved));
    }

    public Map<String, Object> forgotPassword(String email) {
        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByUsername(email);
        }

        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("Email or Username not found");
        }

        User user = userOpt.get();
        int roleId = user.getRoleId();

        // Allow any user role except Admin (1)
        if (roleId != 1) {
            String otp = String.format("%06d", new Random().nextInt(999999));
            String otpTxId = UUID.randomUUID().toString();

            otpStorage.put(otpTxId, OtpSession.builder()
                    .otpCode(otp)
                    .creationTime(System.currentTimeMillis())
                    .pendingData(user.getUsername()) // Use username instead of email for unique lookup
                    .build());

            boolean sent = emailSender.sendVerificationCode(user.getEmail(), otp, "FORGOT_PASSWORD");
            if (!sent) {
                throw new IllegalArgumentException("Failed to send OTP verification email. Please check SMTP configuration.");
            }

            return Map.of("success", true, "otpTxId", otpTxId);
        } else {
            throw new IllegalArgumentException("Admin password cannot be reset via email OTP");
        }
    }

    @Transactional
    public Map<String, Object> verifyForgotPassword(String otpTxId, String enteredOtp, String newPassword) {
        if (newPassword == null || !newPassword.matches("^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$")) {
            return Map.of("success", false, "error", "New password must be at least 8 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character (e.g. @$!%*?&^./,#-_+)");
        }
        if (otpTxId == null || otpTxId.isBlank()) {
            return Map.of("success", false, "error", "Invalid or missing OTP transaction ID");
        }
        OtpSession session = otpStorage.get(otpTxId);
        if (session == null || !session.getOtpCode().equals(enteredOtp)) {
            return Map.of("success", false, "error", "Invalid verification code");
        }

        // Expire in 5 minutes (300,000 ms)
        if ((System.currentTimeMillis() - session.getCreationTime()) > 300000) {
            otpStorage.remove(otpTxId);
            return Map.of("success", false, "error", "Verification code has expired");
        }

        String username = (String) session.getPendingData();
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            otpStorage.remove(otpTxId);
            return Map.of("success", false, "error", "User not found");
        }

        otpStorage.remove(otpTxId);
        User user = userOpt.get();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        return Map.of("success", true, "message", "Password updated successfully");
    }

    @Transactional
    public Boolean toggleOtp(String username, Boolean requireOtp) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isEmpty()) {
            throw new IllegalArgumentException("User not found");
        }
        User user = userOpt.get();
        user.setRequireOtp(requireOtp);
        userRepository.save(user);
        return user.getRequireOtp();
    }

    @Transactional
    public UserDTO updateProfile(UserDTO dto) {
        User user = userRepository.findById(dto.getId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (dto.getEmail() != null) {
            String trimmedEmail = dto.getEmail().trim();
            if (!trimmedEmail.isEmpty() && !trimmedEmail.equals(user.getEmail())) {
                Optional<User> existing = userRepository.findByEmail(trimmedEmail);
                if (existing.isPresent() && !existing.get().getId().equals(user.getId())) {
                    throw new IllegalArgumentException("Email is already taken by another account");
                }
                user.setEmail(trimmedEmail);
            }
        }

        if (dto.getWeight() != null) {
            user.setWeight(dto.getWeight());
        }

        if (dto.getFullName() != null) {
            user.setFullName(dto.getFullName().trim());
        }

        if (dto.getBiography() != null) {
            user.setBiography(dto.getBiography().trim());
        }

        if (dto.getJockeyFee() != null && dto.getJockeyFee().compareTo(java.math.BigDecimal.ZERO) >= 0) {
            user.setJockeyFee(dto.getJockeyFee());
        }

        if (dto.getRequireOtp() != null) {
            user.setRequireOtp(dto.getRequireOtp());
        }

        if (dto.getAvatar() != null) {
            String avatarStr = dto.getAvatar();
            if (avatarStr.length() > 7000000) {
                throw new IllegalArgumentException("Avatar image size exceeds 5MB limit");
            }
            user.setAvatar(avatarStr);
        }

        User saved = userRepository.save(user);

        String roleName = "";
        if (saved.getRoleId() == 1) roleName = "Admin";
        else if (saved.getRoleId() == 2) roleName = "Owner";
        else if (saved.getRoleId() == 3) roleName = "Jockey";
        else if (saved.getRoleId() == 4) roleName = "Referee";
        else if (saved.getRoleId() == 5) roleName = "Spectator";

        UserDTO result = userMapper.toDTO(saved);
        result.setRoleName(roleName);
        return result;
    }
}
