package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.sql.Date;
import com.fasterxml.jackson.annotation.JsonFormat;

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
    private String sex;

    @JsonFormat(pattern = "dd-MM-yyyy HH:mm:ss", timezone = "GMT+7")
    private Date dateOfBirth;
    private String status;          // ACTIVE, INJURED, INACTIVE, PENDING
    private Integer currentRating;
    private Integer totalRaces;
    private Integer totalWins;
    private String avatar;
    private String description;
}
