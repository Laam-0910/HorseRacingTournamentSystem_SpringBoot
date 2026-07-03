package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.RaceEntryDTO;
import com.horseracing.backend.entity.RaceEntry;
import org.springframework.stereotype.Component;

@Component
public class RaceEntryMapper {

    public RaceEntryDTO toDTO(RaceEntry entry, String horseName, String jockeyName) {
        if (entry == null) {
            return null;
        }
        return RaceEntryDTO.builder()
                .id(entry.getId())
                .raceId(entry.getRaceId())
                .horseId(entry.getHorseId())
                .horseName(horseName)
                .jockeyId(entry.getJockeyId())
                .jockeyName(jockeyName)
                .gateNumber(entry.getGateNumber())
                .status(entry.getStatus())
                .finalPosition(entry.getFinalPosition())
                .finishTime(entry.getFinishTime())
                .prizeMoney(entry.getPrizeMoney())
                .carriedWeight(entry.getCarriedWeight())
                .ratingAdjustment(entry.getRatingAdjustment())
                .handicapWeight(entry.getHandicapWeight())
                .build();
    }

    public RaceEntryDTO toDTO(RaceEntry entry) {
        return toDTO(entry, null, null);
    }

    public RaceEntry toEntity(RaceEntryDTO dto) {
        if (dto == null) {
            return null;
        }
        RaceEntry entry = new RaceEntry();
        entry.setId(dto.getId());
        entry.setRaceId(dto.getRaceId());
        entry.setHorseId(dto.getHorseId());
        entry.setJockeyId(dto.getJockeyId());
        entry.setGateNumber(dto.getGateNumber());
        entry.setStatus(dto.getStatus());
        entry.setFinalPosition(dto.getFinalPosition());
        entry.setFinishTime(dto.getFinishTime());
        entry.setPrizeMoney(dto.getPrizeMoney());
        entry.setCarriedWeight(dto.getCarriedWeight());
        entry.setRatingAdjustment(dto.getRatingAdjustment());
        entry.setHandicapWeight(dto.getHandicapWeight());
        return entry;
    }
}
