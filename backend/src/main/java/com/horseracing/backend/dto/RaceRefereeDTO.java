package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RaceRefereeDTO {
    private Integer id;
    private Integer raceId;
    private Integer refereeId;
    private String refereeName;     // Tên trọng tài bổ trợ hiển thị
}
