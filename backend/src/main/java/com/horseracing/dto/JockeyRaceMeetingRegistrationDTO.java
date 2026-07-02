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
public class JockeyRaceMeetingRegistrationDTO {
    private Integer id;
    private Integer raceMeetingId;
    private String raceMeetingName; // Tên Ngày hội đua bổ trợ
    private Integer jockeyId;
    private String jockeyName;      // Tên nài ngựa bổ trợ để hiển thị
    private String status;          // PENDING, APPROVED, REJECTED

    @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss", timezone = "GMT+7")
    private Timestamp registeredAt;
}
