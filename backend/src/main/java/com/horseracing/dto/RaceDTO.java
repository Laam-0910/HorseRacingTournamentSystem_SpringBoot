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
public class RaceDTO {
    private Integer id;
    private Integer raceMeetingId;
    private String raceMeetingName; // Tên Ngày hội đua bổ trợ
    private Timestamp startTime;
    private Timestamp registrationStartTime;
    private Timestamp registrationEndTime;
    private String status;          // SCHEDULED, DECLARATION_OPEN, DECLARATION_CLOSED, RUNNING, OFFICIAL, CANCELLED, etc.
    private String classLevel;
    private Integer minRating;
    private Integer maxRating;
    private Integer distanceMeters;
    private String trackType;
    private BigDecimal purse;
    private Integer maxEntries;
    private String stewardReport;   // Báo cáo của Trọng tài sau trận (cột mới thêm)
    private String youtubeLiveUrl;  // Đường dẫn Youtube livestream
}
