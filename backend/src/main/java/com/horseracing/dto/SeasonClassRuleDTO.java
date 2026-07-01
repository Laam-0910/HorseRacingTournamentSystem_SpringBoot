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
public class SeasonClassRuleDTO {
    private Integer id;
    private Integer seasonId;
    private String classLevel; // 'Class 1', 'Class 2'...
    private String className;
    private Integer minRating;
    private Integer maxRating;
    private BigDecimal minPrize;
    private BigDecimal maxPrize;
}
