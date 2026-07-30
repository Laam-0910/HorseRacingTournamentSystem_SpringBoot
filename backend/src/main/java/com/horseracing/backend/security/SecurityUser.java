package com.horseracing.backend.security;

import com.horseracing.backend.entity.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.Collections;

/**
 * Lớp SecurityUser - Triển khai từ giao diện UserDetails của Spring Security.
 * - Đóng gói thực thể User từ DB để cung cấp thông tin tài khoản và phân quyền cho Spring Security.
 * - Ánh xạ trường roleId của User sang tên Authority phân quyền dạng chuỗi (Ví dụ: ROLE_ADMIN, ROLE_OWNER...).
 * - Kiểm soát trạng thái tài khoản như khóa, hết hạn và kích hoạt (Enabled).
 */
public class SecurityUser implements UserDetails {

    private final User user; // Thực thể người dùng gốc

    // Phương thức khởi tạo
    public SecurityUser(User user) {
        this.user = user;
    }

    // Lấy thông tin thực thể User gốc
    public User getUser() {
        return this.user;
    }

    // Chuyển đổi mã roleId của User sang bộ phân quyền SimpleGrantedAuthority cho Spring Security
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        String roleName = "ROLE_MEMBER"; // Giá trị mặc định
        Integer roleId = user.getRoleId();
        
        // Phân cấp vai trò theo roleId
        if (roleId == 1) roleName = "ROLE_ADMIN";         // Quản trị viên
        else if (roleId == 2) roleName = "ROLE_OWNER";    // Chủ ngựa
        else if (roleId == 3) roleName = "ROLE_JOCKEY";   // Nài ngựa (kỵ sĩ)
        else if (roleId == 4) roleName = "ROLE_SPECTATOR"; // Khán giả
        else if (roleId == 5) roleName = "ROLE_REFEREE";   // Trọng tài
        
        // Trả về danh sách chứa quyền tương ứng
        return Collections.singletonList(new SimpleGrantedAuthority(roleName));
    }

    // Lấy mật khẩu đã băm (PasswordHash) của người dùng
    @Override
    public String getPassword() {
        return user.getPasswordHash();
    }

    // Lấy tên đăng nhập (Username) của người dùng
    @Override
    public String getUsername() {
        return user.getUsername();
    }

    // Trả về true nếu tài khoản chưa bị hết hạn (mặc định luôn đúng)
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    // Trả về true nếu tài khoản chưa bị khóa (mặc định luôn đúng)
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    // Trả về true nếu thông tin chứng thực (mật khẩu) chưa bị hết hạn
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    // Kiểm tra xem tài khoản đã được kích hoạt và cho phép sử dụng chưa
    @Override
    public boolean isEnabled() {
        // Tài khoản chỉ khả dụng khi có cột status mang giá trị "ACTIVE"
        return "ACTIVE".equals(user.getStatus());
    }
}
