package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.sql.Timestamp;
import com.fasterxml.jackson.annotation.JsonFormat;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationDTO {
    private Integer id;
    private Integer raceMeetingId;
    private String raceMeetingName;
    private String type;            // "JOCKEY", "OWNER", "HORSE"
    private Integer targetId;       // jockeyId, ownerId, or horseId
    private String targetName;      // Tên hiển thị (Tên nài ngựa, tên chủ ngựa, hoặc tên ngựa)
    private String status;          // PENDING, APPROVED, REJECTED

    @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss", timezone = "GMT+7")
    private Timestamp registeredAt;
}
