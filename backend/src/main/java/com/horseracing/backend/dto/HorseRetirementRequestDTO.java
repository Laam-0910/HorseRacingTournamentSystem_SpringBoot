package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HorseRetirementRequestDTO {
    private Integer id;
    private Integer horseId;
    private String horseName;
    private Integer ownerId;
    private String ownerName;
    private String reason;
    private String status; // PENDING, APPROVED, REJECTED
    private String adminRemarks;
    private Timestamp createdAt;
    private Timestamp processedAt;
}
