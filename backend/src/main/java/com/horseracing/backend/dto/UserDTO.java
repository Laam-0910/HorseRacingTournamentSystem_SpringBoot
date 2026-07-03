package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

/**
 * DTO trả ra cho client - KHÔNG chứa passwordHash.
 * Dùng khi: xem thông tin user, danh sách user (Admin), profile cá nhân...
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {

    private Integer id;

    private String username;

    private String email;

    private String status;        // ACTIVE, INACTIVE

    private Integer roleId;
    private String roleName;      // Admin, Owner, Jockey, Spectator, Referee

    private BigDecimal weight;                 // chỉ có giá trị với Jockey
    private Integer totalRacesParticipated;     // lịch sử thi đấu
    private Integer totalTop3Finishes;

    private Boolean requireOtp;

    private String avatar;
    private String fullName;
}