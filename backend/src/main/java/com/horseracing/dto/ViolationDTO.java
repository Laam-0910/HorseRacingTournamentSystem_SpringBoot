package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ViolationDTO {
    private Integer id;
    private Integer raceId;
    private Integer horseId;
    private String horseName;       // Tên chiến mã bổ trợ
    private Integer jockeyId;
    private String jockeyName;      // Tên nài ngựa bổ trợ
    private Integer refereeId;
    private String refereeName;     // Tên trọng tài bổ trợ
    private String description;
    private String penalty;
    private String status;          // ví dụ: PENDING, APPROVED...
}
