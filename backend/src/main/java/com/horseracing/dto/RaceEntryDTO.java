package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RaceEntryDTO {
    private Integer id;
    private Integer raceId;
    private Integer horseId;
    private String horseName;       // Tên chiến mã hiển thị bổ trợ
    private Integer jockeyId;
    private String jockeyName;      // Tên nài ngựa hiển thị bổ trợ
    private Integer gateNumber;
    private String status;          // PENDING_ADMIN, APPROVED, RUNNING, FINISHED, DISQUALIFIED, REJECTED
    private Integer finalPosition;
    private String finishTime;
    private BigDecimal prizeMoney;
    private BigDecimal carriedWeight;
    private Integer ratingAdjustment;
    private BigDecimal handicapWeight;
}
