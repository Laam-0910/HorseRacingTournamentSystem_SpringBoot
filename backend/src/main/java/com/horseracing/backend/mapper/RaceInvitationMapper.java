package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.RaceInvitationDTO;
import com.horseracing.backend.entity.RaceInvitation;
import org.springframework.stereotype.Component;

@Component
public class RaceInvitationMapper {

    public RaceInvitationDTO toDTO(RaceInvitation invite, String horseName, String horseAvatar, String ownerName, String ownerAvatar, String jockeyName, String jockeyAvatar) {
        if (invite == null) {
            return null;
        }
        java.math.BigDecimal pct = invite.getJockeyPrizePercentage() != null ? invite.getJockeyPrizePercentage() : new java.math.BigDecimal("20.00");
        return RaceInvitationDTO.builder()
                .id(invite.getId())
                .raceId(invite.getRaceId())
                .horseId(invite.getHorseId())
                .horseName(horseName)
                .horseAvatar(horseAvatar)
                .ownerId(invite.getOwnerId())
                .ownerName(ownerName)
                .ownerAvatar(ownerAvatar)
                .jockeyId(invite.getJockeyId())
                .jockeyName(jockeyName)
                .jockeyAvatar(jockeyAvatar)
                .status(invite.getStatus())
                .commissionAmount(invite.getCommissionAmount())
                .commissionRate(invite.getCommissionRate())
                .payoutStatus(invite.getPayoutStatus())
                .hireFee(invite.getHireFee())
                .jockeyPrizePercentage(pct)
                .build();
    }

    public RaceInvitationDTO toDTO(RaceInvitation invite, String horseName, String ownerName, String jockeyName) {
        return toDTO(invite, horseName, null, ownerName, null, jockeyName, null);
    }

    public RaceInvitationDTO toDTO(RaceInvitation invite) {
        return toDTO(invite, null, null, null, null, null, null);
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
        java.math.BigDecimal pct = dto.getJockeyPrizePercentage() != null ? dto.getJockeyPrizePercentage() : new java.math.BigDecimal("20.00");
        invite.setJockeyPrizePercentage(pct);
        return invite;
    }
}
