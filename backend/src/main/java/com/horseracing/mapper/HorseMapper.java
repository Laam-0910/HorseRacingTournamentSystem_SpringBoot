package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.HorseDTO;
import com.horseracing.backend.entity.Horse;
import org.springframework.stereotype.Component;

@Component
public class HorseMapper {

    public HorseDTO toDTO(Horse horse, String ownerName) {
        if (horse == null) {
            return null;
        }
        return HorseDTO.builder()
                .id(horse.getId())
                .ownerId(horse.getOwnerId())
                .ownerName(ownerName)
                .name(horse.getName())
                .breed(horse.getBreed())
                .dateOfBirth(horse.getDateOfBirth())
                .status(horse.getStatus())
                .currentRating(horse.getCurrentRating())
                .totalRaces(horse.getTotalRaces())
                .totalWins(horse.getTotalWins())
                .imageUrl(null)
                .description(null)
                .build();
    }

    public HorseDTO toDTO(Horse horse) {
        return toDTO(horse, null);
    }

    public Horse toEntity(HorseDTO dto) {
        if (dto == null) {
            return null;
        }
        Horse horse = new Horse();
        horse.setId(dto.getId());
        horse.setOwnerId(dto.getOwnerId());
        horse.setName(dto.getName());
        horse.setBreed(dto.getBreed());
        horse.setDateOfBirth(dto.getDateOfBirth());
        horse.setStatus(dto.getStatus());
        horse.setCurrentRating(dto.getCurrentRating());
        horse.setTotalRaces(dto.getTotalRaces() != null ? dto.getTotalRaces() : 0);
        horse.setTotalWins(dto.getTotalWins() != null ? dto.getTotalWins() : 0);
        return horse;
    }
}
