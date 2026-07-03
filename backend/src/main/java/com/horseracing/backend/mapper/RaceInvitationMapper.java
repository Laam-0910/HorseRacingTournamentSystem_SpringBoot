package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.RaceInvitationDTO;
import com.horseracing.backend.entity.RaceInvitation;
import org.springframework.stereotype.Component;

@Component
public class RaceInvitationMapper {

    public RaceInvitationDTO toDTO(RaceInvitation invite, String horseName, String ownerName, String jockeyName) {
        if (invite == null) {
            return null;
        }
        return RaceInvitationDTO.builder()
                .id(invite.getId())
                .raceId(invite.getRaceId())
                .horseId(invite.getHorseId())
                .horseName(horseName)
                .ownerId(invite.getOwnerId())
                .ownerName(ownerName)
                .jockeyId(invite.getJockeyId())
                .jockeyName(jockeyName)
                .status(invite.getStatus())
                .build();
    }

    public RaceInvitationDTO toDTO(RaceInvitation invite) {
        return toDTO(invite, null, null, null);
    }

    public RaceInvitation toEntity(RaceInvitationDTO dto) {
        if (dto == null) {
            return null;
        }
        RaceInvitation invite = new RaceInvitation();
        invite.setId(dto.getId());
        invite.setRaceId(dto.getRaceId());
        invite.setHorseId(dto.getHorseId());
        invite.setOwnerId(dto.getOwnerId());
        invite.setJockeyId(dto.getJockeyId());
        invite.setStatus(dto.getStatus());
        return invite;
    }
}
