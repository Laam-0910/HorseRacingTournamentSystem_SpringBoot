package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.RegisterRequestDTO;
import com.horseracing.backend.dto.UserDTO;
import com.horseracing.backend.entity.User;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserDTO toDTO(User user, String roleName) {
        if (user == null) {
            return null;
        }
        return UserDTO.builder()
                .id(user.getId())
                .username(user.getUsername() != null ? user.getUsername().trim() : null)
                .email(user.getEmail() != null ? user.getEmail().trim() : null)
                .status(user.getStatus() != null ? user.getStatus().trim() : null)
                .roleId(user.getRoleId())
                .roleName(roleName != null ? roleName.trim() : null)
                .weight(user.getWeight())
                .totalRacesParticipated(user.getTotalRacesParticipated())
                .totalTop3Finishes(user.getTotalTop3Finishes())
                .requireOtp(user.getRequireOtp())
                .avatar(user.getAvatar() != null ? user.getAvatar().trim() : null)
                .build();
    }

    public UserDTO toDTO(User user) {
        return toDTO(user, null);
    }

    public User toEntity(UserDTO dto) {
        if (dto == null) {
            return null;
        }
        User user = new User();
        user.setId(dto.getId());
        user.setUsername(dto.getUsername() != null ? dto.getUsername().trim() : null);
        user.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : null);
        user.setStatus(dto.getStatus() != null ? dto.getStatus().trim() : null);
        user.setRoleId(dto.getRoleId());
        user.setWeight(dto.getWeight());
        user.setTotalRacesParticipated(dto.getTotalRacesParticipated());
        user.setTotalTop3Finishes(dto.getTotalTop3Finishes());
        user.setRequireOtp(dto.getRequireOtp());
        user.setAvatar(dto.getAvatar() != null ? dto.getAvatar().trim() : null);
        return user;
    }

    public User toEntity(RegisterRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        User user = new User();
        user.setUsername(dto.getUsername() != null ? dto.getUsername().trim() : null);
        user.setEmail(dto.getEmail() != null ? dto.getEmail().trim() : null);
        user.setPasswordHash(dto.getPassword()); // Cần mã hóa sau đó ở Service
        user.setRoleId(dto.getRoleId());
        user.setWeight(dto.getWeight());
        user.setStatus("ACTIVE");
        user.setRequireOtp(false);
        user.setTotalRacesParticipated(0);
        user.setTotalTop3Finishes(0);
        return user;
    }
}
