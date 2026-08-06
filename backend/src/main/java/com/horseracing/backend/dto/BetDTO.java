package com.horseracing.backend.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class BetDTO {
    private Integer id;
    private Integer userId;
    private Integer raceId;
    private Integer horseId;
    private BigDecimal amount;
    private BigDecimal odds;
    private String status;
    private BigDecimal payout;
    private String createdAt;

    // Extra display fields
    private String horseName;
    private String raceName;
    private String username;
    private BigDecimal potentialPayout;
}
