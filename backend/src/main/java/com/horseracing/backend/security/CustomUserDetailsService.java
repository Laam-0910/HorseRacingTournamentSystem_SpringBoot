package com.horseracing.backend.security;

import com.horseracing.backend.entity.User;
import com.horseracing.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

/**
 * Lớp CustomUserDetailsService - Triển khai từ giao diện UserDetailsService của Spring Security.
 * - Được sử dụng để tải thông tin người dùng từ cơ sở dữ liệu trong quá trình xác thực và kiểm tra Token.
 * - Hỗ trợ đăng nhập linh hoạt bằng cả Tên tài khoản (username) hoặc Email.
 * - Đóng gói thực thể User tìm thấy thành đối tượng SecurityUser tương thích với Spring Security context.
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository; // Kho lưu trữ thông tin người dùng

    // Nạp chi tiết người dùng dựa vào Username hoặc Email
    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Tìm người dùng theo username, nếu không thấy thì tiếp tục tìm theo email
        User user = userRepository.findByUsername(username)
                .or(() -> userRepository.findByEmail(username))
                .orElseThrow(() -> new UsernameNotFoundException("User not found with username or email: " + username));
        
        // Trả về đối tượng SecurityUser bọc quanh thực thể User
        return new SecurityUser(user);
    }
}
