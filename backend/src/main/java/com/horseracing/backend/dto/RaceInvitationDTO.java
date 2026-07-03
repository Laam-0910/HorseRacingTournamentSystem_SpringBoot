package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RaceInvitationDTO {
    private Integer id;
    private Integer raceId;
    private Integer horseId;
    private String horseName;       // Tên chiến mã bổ trợ
    private Integer ownerId;
    private String ownerName;       // Tên chủ ngựa bổ trợ
    private Integer jockeyId;
    private String jockeyName;      // Tên nài ngựa bổ trợ
    private String status;          // PENDING, ACCEPTED, REJECTED, EXPIRED
}
