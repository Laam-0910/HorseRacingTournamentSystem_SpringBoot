package com.horseracing.backend.service;

import com.horseracing.backend.dto.UserDTO;
import com.horseracing.backend.entity.User;
import com.horseracing.backend.entity.Role;
import com.horseracing.backend.mapper.UserMapper;
import com.horseracing.backend.repository.UserRepository;
import com.horseracing.backend.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Lớp dịch vụ UserService - Quản lý tài khoản người dùng hệ thống.
 * - Lấy danh sách toàn bộ người dùng, ánh xạ kèm tên vai trò tương ứng (Role Name).
 * - Tra cứu chi tiết tài khoản theo ID hoặc theo Mã vai trò (roleId).
 * - Tạo tài khoản thủ công có kiểm duyệt điều kiện hợp lệ đầu vào (Username duy nhất, mật khẩu bảo mật mạnh chứa chữ hoa, số và ký tự đặc biệt).
 * - Cập nhật thông số tài khoản (Tên, Email, Vai trò, Cân nặng...).
 * - Khóa hoặc mở khóa tài khoản (Toggle Status).
 */
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository; // Kho lưu trữ người dùng
    private final RoleRepository roleRepository; // Kho lưu trữ vai trò
    private final UserMapper userMapper; // Bộ ánh xạ User sang DTO
    private final PasswordEncoder passwordEncoder; // Bộ mã hóa mật khẩu BCrypt

    // Lấy toàn bộ danh sách người dùng đính kèm tên vai trò
    public List<UserDTO> getAllUsers() {
        // Tải trước toàn bộ vai trò vào Map để tra cứu nhanh tránh truy vấn N+1
        Map<Integer, String> roleMap = roleRepository.findAll().stream()
                .collect(Collectors.toMap(Role::getId, Role::getRoleName));

        return userRepository.findAll().stream()
                .map(u -> userMapper.toDTO(u, roleMap.get(u.getRoleId())))
                .collect(Collectors.collectingAndThen(Collectors.toList(), List::copyOf));
    }

    // Lấy chi tiết tài khoản theo ID
    public UserDTO getUserById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String roleName = roleRepository.findById(user.getRoleId())
                .map(Role::getRoleName)
                .orElse(null);
        return userMapper.toDTO(user, roleName);
    }

    // Lọc danh sách người dùng theo vai trò
    public List<UserDTO> getUsersByRoleId(Integer roleId) {
        String roleName = roleRepository.findById(roleId)
                .map(Role::getRoleName)
                .orElse(null);
        return userRepository.findByRoleId(roleId).stream()
                .map(u -> userMapper.toDTO(u, roleName))
                .toList();
    }

    // Tạo mới tài khoản thủ công (Dành cho Admin)
    @Transactional
    public UserDTO createUserManual(String username, String email, String password, Integer roleId, java.math.BigDecimal weight) {
        // 1. Kiểm tra tính hợp lệ của Tên đăng nhập
        if (username == null || username.trim().length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters long");
        }
        if (userRepository.findByUsername(username.trim()).isPresent()) {
            throw new IllegalArgumentException("Username is already taken");
        }
        // 2. Kiểm tra tính trùng lặp của Email
        if (email != null && !email.trim().isEmpty() && userRepository.findByEmail(email.trim()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }
        // 3. Kiểm tra độ phức tạp của mật khẩu bằng biểu thức chính quy (Regex)
        if (password == null || !password.matches("^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$")) {
            throw new IllegalArgumentException("Password must be at least 8 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character (e.g. @$!%*?&^./,#-_+)");
        }

        User user = new User();
        user.setUsername(username.trim());
        user.setEmail(email != null ? email.trim() : null);
        user.setPasswordHash(passwordEncoder.encode(password)); // Mã hóa mật khẩu
        user.setRoleId(roleId != null ? roleId : 4); // Mặc định là vai trò Khán giả (4) nếu bỏ trống
        user.setStatus("ACTIVE"); // Kích hoạt ngay lập tức
        user.setRequireOtp(false);
        user.setWeight(weight);
        user.setTotalRacesParticipated(0);
        user.setTotalTop3Finishes(0);

        User savedUser = userRepository.save(user);
        return userMapper.toDTO(savedUser);
    }

    // Cập nhật thông tin tài khoản người dùng
    @Transactional
    public UserDTO updateUser(Integer id, String username, String email, Integer roleId, Boolean requireOtp, java.math.BigDecimal weight) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setUsername(username);
        user.setEmail(email);
        user.setRoleId(roleId);
        user.setRequireOtp(requireOtp);
        user.setWeight(weight);

        User savedUser = userRepository.save(user);
        return userMapper.toDTO(savedUser);
    }

    // Đảo trạng thái khóa / kích hoạt tài khoản
    @Transactional
    public String toggleUserStatus(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        // Nếu đang ACTIVE thì đổi sang INACTIVE và ngược lại
        user.setStatus("ACTIVE".equals(user.getStatus()) ? "INACTIVE" : "ACTIVE");
        userRepository.save(user);
        return user.getStatus();
    }
}
