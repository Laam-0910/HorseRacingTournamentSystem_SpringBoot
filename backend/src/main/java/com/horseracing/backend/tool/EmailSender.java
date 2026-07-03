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

    public EmailSender() {
        mailSender = new JavaMailSenderImpl();
        mailSender.setHost("smtp.gmail.com");
        mailSender.setPort(587);
        mailSender.setUsername(SENDER_EMAIL);
        mailSender.setPassword(APP_PASSWORD);

        Properties props = mailSender.getJavaMailProperties();
        props.put("mail.transport.protocol", "smtp");
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.debug", "false");
    }

    public boolean sendVerificationCode(String toEmail, String code, String type) {
        log.info("Sending OTP code {} of type {} to {}", code, type, toEmail);
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(SENDER_EMAIL, "HorseRace System");
            helper.setTo(toEmail);

            if ("LOGIN".equalsIgnoreCase(type)) {
                helper.setSubject("Your Login Verification Code");
                helper.setText(
                        "<div style='font-family: sans-serif; padding: 20px; background-color: #f4f2ec; color: #0b0a08;'>" +
                        "<h2 style='color: #c9a227;'>Login Verification</h2>" +
                        "<p>Your verification code is: <b style='font-size: 24px;'>" + code + "</b></p>" +
                        "<p>Please enter this code to complete your login. It will expire shortly.</p>" +
                        "</div>",
                        true
                );
            } else if ("FORGOT_PASSWORD".equalsIgnoreCase(type)) {
                helper.setSubject("Your Password Reset Code");
                helper.setText(
                        "<div style='font-family: sans-serif; padding: 20px; background-color: #f4f2ec; color: #0b0a08;'>" +
                        "<h2 style='color: #c9a227;'>Password Reset</h2>" +
                        "<p>Your password reset code is: <b style='font-size: 24px;'>" + code + "</b></p>" +
                        "<p>If you didn't request a password reset, please ignore this email.</p>" +
                        "</div>",
                        true
                );
            } else if ("REGISTER".equalsIgnoreCase(type)) {
                helper.setSubject("Account Registration Verification Code");
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

            mailSender.send(message);
            log.info("Successfully sent email to {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage(), e);
            return false;
        }
    }
}
