package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.SeasonDTO;
import com.horseracing.backend.entity.Season;
import org.springframework.stereotype.Component;

@Component
public class SeasonMapper {

    public SeasonDTO toDTO(Season season) {
        if (season == null) {
            return null;
        }
        return SeasonDTO.builder()
                .id(season.getId())
                .name(season.getName())
                .startDate(season.getStartDate())
                .endDate(season.getEndDate())
                .status(season.getStatus())
                .build();
    }

    public Season toEntity(SeasonDTO dto) {
        if (dto == null) {
            return null;
        }
        Season season = new Season();
        season.setId(dto.getId());
        season.setName(dto.getName());
        season.setStartDate(dto.getStartDate());
        season.setEndDate(dto.getEndDate());
        season.setStatus(dto.getStatus());
        return season;
    }
}
