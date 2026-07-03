package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.ViolationDTO;
import com.horseracing.backend.entity.Violation;
import org.springframework.stereotype.Component;

@Component
public class ViolationMapper {

    public ViolationDTO toDTO(Violation violation, String horseName, String jockeyName, String refereeName) {
        if (violation == null) {
            return null;
        }
        return ViolationDTO.builder()
                .id(violation.getId())
                .raceId(violation.getRaceId())
                .horseId(violation.getHorseId())
                .horseName(horseName)
                .jockeyId(violation.getJockeyId())
                .jockeyName(jockeyName)
                .refereeId(violation.getRefereeId())
                .refereeName(refereeName)
                .description(violation.getDescription())
                .penalty(violation.getPenalty())
                .status(violation.getStatus())
                .build();
    }

    public ViolationDTO toDTO(Violation violation) {
        return toDTO(violation, null, null, null);
    }

    public Violation toEntity(ViolationDTO dto) {
        if (dto == null) {
            return null;
        }
        Violation violation = new Violation();
        violation.setId(dto.getId());
        violation.setRaceId(dto.getRaceId());
        violation.setHorseId(dto.getHorseId());
        violation.setJockeyId(dto.getJockeyId());
        violation.setRefereeId(dto.getRefereeId());
        violation.setDescription(dto.getDescription());
        violation.setPenalty(dto.getPenalty());
        violation.setStatus(dto.getStatus());
        return violation;
    }
}
