package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OwnerRaceMeetingRegistrationDTO {
    private Integer id;
    private Integer raceMeetingId;
    private String raceMeetingName;
    private Integer ownerId;
    private String ownerName;       // Tên chủ ngựa bổ trợ
    private String status;          // PENDING, APPROVED, REJECTED
    private Timestamp registeredAt;
}
