package com.horseracing.backend.tool;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;
import org.springframework.mail.javamail.JavaMailSenderImpl;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;

import java.util.Properties;

@Component
@Slf4j
public class EmailSender {

    private static final String SENDER_EMAIL = "se193987caonhatlam@gmail.com";
    private static final String APP_PASSWORD = "yenl egam eppu xkpo";

    private final JavaMailSenderImpl mailSender;

    // Khởi tạo đối tượng EmailSender với cấu hình SMTP Gmail
    public EmailSender() {
        mailSender = new JavaMailSenderImpl(); // Khởi tạo thực thể gửi mail JavaMailSenderImpl
        mailSender.setHost("smtp.gmail.com"); // Cấu hình địa chỉ máy chủ SMTP của Gmail
        mailSender.setPort(587); // Cấu hình cổng kết nối TLS (587)
        mailSender.setUsername(SENDER_EMAIL); // Địa chỉ email gửi đi mặc định
        mailSender.setPassword(APP_PASSWORD); // Mật khẩu ứng dụng (App Password) của Gmail

        Properties props = mailSender.getJavaMailProperties(); // Lấy đối tượng thuộc tính cấu hình mail
        props.put("mail.transport.protocol", "smtp"); // Giao thức truyền tải SMTP
        props.put("mail.smtp.auth", "true"); // Bật yêu cầu xác thực tài khoản khi gửi
        props.put("mail.smtp.starttls.enable", "true"); // Bật mã hóa kết nối STARTTLS
        props.put("mail.debug", "false"); // Tắt log debug chi tiết của JavaMail
    }

    // Hàm gửi mã xác thực OTP (Đăng nhập, Quên mật khẩu, Đăng ký) tới Email
    public boolean sendVerificationCode(String toEmail, String code, String type) {
        log.info("Sending OTP code {} of type {} to {}", code, type, toEmail); // Ghi log bắt đầu tiến trình gửi OTP
        try {
            MimeMessage message = mailSender.createMimeMessage(); // Tạo thông điệp MIME mail mới
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8"); // Khởi tạo helper hỗ trợ định dạng UTF-8 và HTML

            helper.setFrom(SENDER_EMAIL, "HorseRace System"); // Thiết lập người gửi và tên hiển thị thương hiệu
            helper.setTo(toEmail); // Thiết lập địa chỉ email người nhận

            if ("LOGIN".equalsIgnoreCase(type)) { // Trường hợp gửi OTP xác thực đăng nhập 2FA
                helper.setSubject("Your Login Verification Code"); // Tiêu đề thư đăng nhập
                helper.setText(
                        "<div style='font-family: sans-serif; padding: 20px; background-color: #f4f2ec; color: #0b0a08;'>" +
                        "<h2 style='color: #c9a227;'>Login Verification</h2>" +
                        "<p>Your verification code is: <b style='font-size: 24px;'>" + code + "</b></p>" +
                        "<p>Please enter this code to complete your login. It will expire shortly.</p>" +
                        "</div>",
                        true
                );
            } else if ("FORGOT_PASSWORD".equalsIgnoreCase(type)) { // Trường hợp gửi OTP khôi phục mật khẩu
                helper.setSubject("Your Password Reset Code"); // Tiêu đề thư khôi phục mật khẩu
                helper.setText(
                        "<div style='font-family: sans-serif; padding: 20px; background-color: #f4f2ec; color: #0b0a08;'>" +
                        "<h2 style='color: #c9a227;'>Password Reset</h2>" +
                        "<p>Your password reset code is: <b style='font-size: 24px;'>" + code + "</b></p>" +
                        "<p>If you didn't request a password reset, please ignore this email.</p>" +
                        "</div>",
                        true
                );
            } else if ("REGISTER".equalsIgnoreCase(type)) { // Trường hợp gửi OTP kích hoạt tài khoản mới đăng ký
                helper.setSubject("Account Registration Verification Code"); // Tiêu đề thư đăng ký tài khoản
                helper.setText(
                        "<div style='font-family: sans-serif; padding: 20px; background-color: #f4f2ec; color: #0b0a08;'>" +
                        "<h2 style='color: #c9a227;'>Account Registration</h2>" +
                        "<p>Welcome to HorseRace Management System!</p>" +
                        "<p>Your registration verification code is: <b style='font-size: 24px;'>" + code + "</b></p>" +
                        "<p>Please enter this code to complete your account registration. It will expire shortly.</p>" +
                        "</div>",
                        true
                );
            }

            mailSender.send(message); // Thực thi gửi thông điệp email qua JavaMailSender
            log.info("Successfully sent email to {}", toEmail); // Ghi log gửi mail thành công
            return true; // Trả về true báo hiệu thành công
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage(), e); // Ghi log lỗi nếu gửi mail thất bại
            return false; // Trả về false báo hiệu thất bại
        }
    }
}
