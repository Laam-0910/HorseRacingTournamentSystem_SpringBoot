package tool;

import java.util.Properties;
import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeMessage;

public class EmailSender {

    // IMPORTANT: Replace this with your actual Google App Password
    private static final String SENDER_EMAIL = "se193987caonhatlam@gmail.com";
    private static final String APP_PASSWORD = "yenl egam eppu xkpo"; 

    public static boolean sendVerificationCode(String toEmail, String code, String type) {
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", "smtp.gmail.com");
        props.put("mail.smtp.port", "587");
        
        Session session = Session.getInstance(props, new Authenticator() {
            @Override
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(SENDER_EMAIL, APP_PASSWORD);
            }
        });

        try {
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(SENDER_EMAIL, "HorseRace System"));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));

            if ("LOGIN".equalsIgnoreCase(type)) {
                message.setSubject("Your Login Verification Code");
                message.setContent(
                        "<div style='font-family: sans-serif; padding: 20px; background-color: #f4f2ec; color: #0b0a08;'>" +
                        "<h2 style='color: #c9a227;'>Login Verification</h2>" +
                        "<p>Your verification code is: <b style='font-size: 24px;'>" + code + "</b></p>" +
                        "<p>Please enter this code to complete your login. It will expire shortly.</p>" +
                        "</div>", 
                        "text/html; charset=utf-8"
                );
            } else if ("FORGOT_PASSWORD".equalsIgnoreCase(type)) {
                message.setSubject("Your Password Reset Code");
                message.setContent(
                        "<div style='font-family: sans-serif; padding: 20px; background-color: #f4f2ec; color: #0b0a08;'>" +
                        "<h2 style='color: #c9a227;'>Password Reset</h2>" +
                        "<p>Your password reset code is: <b style='font-size: 24px;'>" + code + "</b></p>" +
                        "<p>If you didn't request a password reset, please ignore this email.</p>" +
                        "</div>", 
                        "text/html; charset=utf-8"
                );
            } else if ("REGISTER".equalsIgnoreCase(type)) {
                message.setSubject("Account Registration Verification Code");
                message.setContent(
                        "<div style='font-family: sans-serif; padding: 20px; background-color: #f4f2ec; color: #0b0a08;'>" +
                        "<h2 style='color: #c9a227;'>Account Registration</h2>" +
                        "<p>Welcome to HorseRace Management System!</p>" +
                        "<p>Your registration verification code is: <b style='font-size: 24px;'>" + code + "</b></p>" +
                        "<p>Please enter this code to complete your account registration. It will expire shortly.</p>" +
                        "</div>", 
                        "text/html; charset=utf-8"
                );
            }
            Transport.send(message);
            return true;
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
