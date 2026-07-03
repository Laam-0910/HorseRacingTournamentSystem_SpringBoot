package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.RaceDTO;
import com.horseracing.backend.entity.Race;
import org.springframework.stereotype.Component;

@Component
public class RaceMapper {

    public RaceDTO toDTO(Race race, String meetingName) {
        if (race == null) {
            return null;
        }
        return RaceDTO.builder()
                .id(race.getId())
                .raceMeetingId(race.getRaceMeetingId())
                .raceMeetingName(meetingName)
                .startTime(race.getStartTime())
                .registrationStartTime(race.getRegistrationStartTime())
                .registrationEndTime(race.getRegistrationEndTime())
                .status(race.getStatus())
                .classLevel(race.getClassLevel())
                .minRating(race.getMinRating())
                .maxRating(race.getMaxRating())
                .distanceMeters(race.getDistanceMeters())
                .trackType(race.getTrackType())
                .purse(race.getPurse())
                .maxEntries(race.getMaxEntries())
                .stewardReport(race.getStewardReport())
                .youtubeLiveUrl(race.getYoutubeLiveUrl())
                .build();
    }

    public RaceDTO toDTO(Race race) {
        return toDTO(race, null);
    }

    public Race toEntity(RaceDTO dto) {
        if (dto == null) {
            return null;
        }
        Race race = new Race();
        race.setId(dto.getId());
        race.setRaceMeetingId(dto.getRaceMeetingId());
        race.setStartTime(dto.getStartTime());
        race.setRegistrationStartTime(dto.getRegistrationStartTime());
        race.setRegistrationEndTime(dto.getRegistrationEndTime());
        race.setStatus(dto.getStatus());
        race.setClassLevel(dto.getClassLevel());
        race.setMinRating(dto.getMinRating());
        race.setMaxRating(dto.getMaxRating());
        race.setDistanceMeters(dto.getDistanceMeters());
        race.setTrackType(dto.getTrackType());
        race.setPurse(dto.getPurse());
        race.setMaxEntries(dto.getMaxEntries());
        race.setStewardReport(dto.getStewardReport());
        race.setYoutubeLiveUrl(dto.getYoutubeLiveUrl());
        return race;
    }
}
