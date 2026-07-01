package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RaceMeetingDTO {
    private Integer id;
    private Integer seasonId;
    private String seasonName; // Tên của Mùa giải để tiện hiển thị
    private String name;        // ví dụ: Spring Gold Cup Day
    private Timestamp startDate;
    private String venue;
    private BigDecimal totalBudget;
}
