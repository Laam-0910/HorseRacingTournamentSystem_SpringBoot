package com.horseracing.backend.runner;

import com.horseracing.backend.entity.User;
import com.horseracing.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class PasswordEncryptionRunner implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Ghi log bắt đầu kiểm tra mật khẩu chưa mã hóa trong cơ sở dữ liệu
        log.info("Checking for unencrypted passwords in database...");
        // Tải danh sách tất cả người dùng từ CSDL
        List<User> users = userRepository.findAll();
        // Biến đếm số lượng tài khoản đã được tự động cập nhật mã hóa
        int updateCount = 0;
        // Duyệt qua từng tài khoản trong danh sách
        for (User user : users) {
            // Lấy chuỗi băm mật khẩu hiện tại của người dùng
            String hash = user.getPasswordHash();
            // Kiểm tra nếu chuỗi băm không bị rỗng
            if (hash != null) {
                // Nếu chuỗi chưa có tiền tố BCrypt ($2a$, $2b$, $2y$), tiến hành mã hóa
                if (!hash.startsWith("$2a$") && !hash.startsWith("$2b$") && !hash.startsWith("$2y$")) {
                    // Ghi log thông báo băm mật khẩu cho tài khoản tương ứng
                    log.info("Encrypting password for user: {}", user.getUsername());
                    // Băm mật khẩu bằng bộ mã hóa PasswordEncoder (BCrypt)
                    String encrypted = passwordEncoder.encode(hash);
                    // Cập nhật chuỗi đã mã hóa mới vào đối tượng User
                    user.setPasswordHash(encrypted);
                    // Lưu bản ghi người dùng đã cập nhật vào DB
                    userRepository.save(user);
                    // Tăng số lượng tài khoản được cập nhật
                    updateCount++;
                }
            }
        }
        // Nếu có ít nhất 1 tài khoản được nâng cấp mã hóa
        if (updateCount > 0) {
            // Ghi log hoàn tất thành công số tài khoản đã băm mật khẩu
            log.info("Successfully encrypted {} plain-text password hashes in the database.", updateCount);
        } else {
            // Ghi log thông báo tất cả mật khẩu đã ở dạng mã hóa an toàn
            log.info("All passwords are already encrypted.");
        }
    }
}
