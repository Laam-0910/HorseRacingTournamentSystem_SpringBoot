package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.RaceRefereeDTO;
import com.horseracing.backend.entity.RaceReferee;
import org.springframework.stereotype.Component;

@Component
public class RaceRefereeMapper {

    public RaceRefereeDTO toDTO(RaceReferee referee, String refereeName) {
        if (referee == null) {
            return null;
        }
        return RaceRefereeDTO.builder()
                .id(referee.getId())
                .raceId(referee.getRaceId())
                .refereeId(referee.getRefereeId())
                .refereeName(refereeName)
                .build();
    }

    public RaceRefereeDTO toDTO(RaceReferee referee) {
        return toDTO(referee, null);
    }

    public RaceReferee toEntity(RaceRefereeDTO dto) {
        if (dto == null) {
            return null;
        }
        RaceReferee referee = new RaceReferee();
        referee.setId(dto.getId());
        referee.setRaceId(dto.getRaceId());
        referee.setRefereeId(dto.getRefereeId());
        return referee;
    }
}
