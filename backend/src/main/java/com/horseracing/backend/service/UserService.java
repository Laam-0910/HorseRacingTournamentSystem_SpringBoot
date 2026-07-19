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

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    public List<UserDTO> getAllUsers() {
        Map<Integer, String> roleMap = roleRepository.findAll().stream()
                .collect(Collectors.toMap(Role::getId, Role::getRoleName));

        return userRepository.findAll().stream()
                .map(u -> userMapper.toDTO(u, roleMap.get(u.getRoleId())))
                .collect(Collectors.collectingAndThen(Collectors.toList(), List::copyOf));
    }

    public UserDTO getUserById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        String roleName = roleRepository.findById(user.getRoleId())
                .map(Role::getRoleName)
                .orElse(null);
        return userMapper.toDTO(user, roleName);
    }

    public List<UserDTO> getUsersByRoleId(Integer roleId) {
        String roleName = roleRepository.findById(roleId)
                .map(Role::getRoleName)
                .orElse(null);
        return userRepository.findByRoleId(roleId).stream()
                .map(u -> userMapper.toDTO(u, roleName))
                .toList();
    }

    @Transactional
    public UserDTO createUserManual(String username, String email, String password, Integer roleId, java.math.BigDecimal weight) {
        if (username == null || username.trim().length() < 3) {
            throw new IllegalArgumentException("Username must be at least 3 characters long");
        }
        if (userRepository.findByUsername(username.trim()).isPresent()) {
            throw new IllegalArgumentException("Username is already taken");
        }
        if (email != null && !email.trim().isEmpty() && userRepository.findByEmail(email.trim()).isPresent()) {
            throw new IllegalArgumentException("Email is already registered");
        }
        if (password == null || !password.matches("^(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,}$")) {
            throw new IllegalArgumentException("Password must be at least 8 characters long, containing at least 1 uppercase letter, 1 number, and 1 special character (e.g. @$!%*?&^./,#-_+)");
        }

        User user = new User();
        user.setUsername(username.trim());
        user.setEmail(email != null ? email.trim() : null);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRoleId(roleId != null ? roleId : 4);
        user.setStatus("ACTIVE");
        user.setRequireOtp(false);
        user.setWeight(weight);
        user.setTotalRacesParticipated(0);
        user.setTotalTop3Finishes(0);

        User savedUser = userRepository.save(user);
        return userMapper.toDTO(savedUser);
    }

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

    @Transactional
    public String toggleUserStatus(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        user.setStatus("ACTIVE".equals(user.getStatus()) ? "INACTIVE" : "ACTIVE");
        userRepository.save(user);
        return user.getStatus();
    }
}
