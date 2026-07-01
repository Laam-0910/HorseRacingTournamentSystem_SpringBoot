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
                .username(user.getUsername())
                .email(user.getEmail())
                .status(user.getStatus())
                .roleId(user.getRoleId())
                .roleName(roleName)
                .weight(user.getWeight())
                .totalRacesParticipated(user.getTotalRacesParticipated())
                .totalTop3Finishes(user.getTotalTop3Finishes())
                .requireOtp(user.getRequireOtp())
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
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
        user.setStatus(dto.getStatus());
        user.setRoleId(dto.getRoleId());
        user.setWeight(dto.getWeight());
        user.setTotalRacesParticipated(dto.getTotalRacesParticipated());
        user.setTotalTop3Finishes(dto.getTotalTop3Finishes());
        user.setRequireOtp(dto.getRequireOtp());
        return user;
    }

    public User toEntity(RegisterRequestDTO dto) {
        if (dto == null) {
            return null;
        }
        User user = new User();
        user.setUsername(dto.getUsername());
        user.setEmail(dto.getEmail());
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
