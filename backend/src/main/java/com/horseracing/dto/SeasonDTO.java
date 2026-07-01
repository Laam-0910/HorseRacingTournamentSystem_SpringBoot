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
public class SeasonDTO {
    private Integer id;
    private String name;
    private Date startDate;
    private Date endDate;
    private String status; // ACTIVE, CLOSED
}
