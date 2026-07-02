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
public class HorseRaceMeetingRegistrationDTO {
    private Integer id;
    private Integer raceMeetingId;
    private String raceMeetingName;
    private Integer horseId;
    private String horseName;       // Tên chiến mã bổ trợ để hiển thị
    private String status;          // PENDING, APPROVED, REJECTED

    @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss", timezone = "GMT+7")
    private Timestamp registeredAt;
}
