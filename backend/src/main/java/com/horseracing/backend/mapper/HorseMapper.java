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
                .ownerName(ownerName != null ? ownerName.trim() : null)
                .name(horse.getName() != null ? horse.getName().trim() : null)
                .breed(horse.getBreed() != null ? horse.getBreed().trim() : null)
                .sex(horse.getSex() != null ? horse.getSex().trim() : null)
                .dateOfBirth(horse.getDateOfBirth())
                .status(horse.getStatus() != null ? horse.getStatus().trim() : null)
                .currentRating(horse.getCurrentRating())
                .totalRaces(horse.getTotalRaces())
                .totalWins(horse.getTotalWins())
                .avatar(horse.getAvatar() != null ? horse.getAvatar().trim() : null)
                .description(horse.getDescription() != null ? horse.getDescription().trim() : null)
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
        horse.setName(dto.getName() != null ? dto.getName().trim() : null);
        horse.setBreed(dto.getBreed() != null ? dto.getBreed().trim() : null);
        horse.setSex(dto.getSex() != null ? dto.getSex().trim() : null);
        horse.setDateOfBirth(dto.getDateOfBirth());
        horse.setStatus(dto.getStatus() != null ? dto.getStatus().trim() : null);
        horse.setCurrentRating(dto.getCurrentRating());
        horse.setTotalRaces(dto.getTotalRaces() != null ? dto.getTotalRaces() : 0);
        horse.setTotalWins(dto.getTotalWins() != null ? dto.getTotalWins() : 0);
        horse.setAvatar(dto.getAvatar() != null ? dto.getAvatar().trim() : null);
        horse.setDescription(dto.getDescription() != null ? dto.getDescription().trim() : null);
        return horse;
    }
}
