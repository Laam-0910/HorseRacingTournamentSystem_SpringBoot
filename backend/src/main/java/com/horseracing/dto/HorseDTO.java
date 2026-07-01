package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.sql.Date;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HorseDTO {
    private Integer id;
    private Integer ownerId;
    private String ownerName;       // Tên chủ ngựa hiển thị
    private String name;
    private String breed;
    private Date dateOfBirth;
    private String status;          // ACTIVE, INJURED, INACTIVE, PENDING
    private Integer currentRating;
    private Integer totalRaces;
    private Integer totalWins;
    private String imageUrl;
    private String description;
}
