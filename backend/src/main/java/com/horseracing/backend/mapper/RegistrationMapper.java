package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.HorseRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.JockeyRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.OwnerRaceMeetingRegistrationDTO;
import com.horseracing.backend.dto.RegistrationDTO;
import com.horseracing.backend.entity.HorseRaceMeetingRegistration;
import com.horseracing.backend.entity.JockeyRaceMeetingRegistration;
import com.horseracing.backend.entity.OwnerRaceMeetingRegistration;
import org.springframework.stereotype.Component;

@Component
public class RegistrationMapper {

    // --- Jockey Registration ---
    public JockeyRaceMeetingRegistrationDTO toDTO(JockeyRaceMeetingRegistration reg, String jockeyName, String meetingName) {
        if (reg == null) {
            return null;
        }
        return JockeyRaceMeetingRegistrationDTO.builder()
                .id(reg.getId())
                .raceMeetingId(reg.getRaceMeetingId())
                .raceMeetingName(meetingName)
                .jockeyId(reg.getJockeyId())
                .jockeyName(jockeyName)
                .status(reg.getStatus())
                .registeredAt(reg.getRegisteredAt())
                .build();
    }

    public JockeyRaceMeetingRegistration toEntity(JockeyRaceMeetingRegistrationDTO dto) {
        if (dto == null) {
            return null;
        }
        JockeyRaceMeetingRegistration reg = new JockeyRaceMeetingRegistration();
        reg.setId(dto.getId());
        reg.setRaceMeetingId(dto.getRaceMeetingId());
        reg.setJockeyId(dto.getJockeyId());
        reg.setStatus(dto.getStatus());
        reg.setRegisteredAt(dto.getRegisteredAt());
        return reg;
    }

    // --- Owner Registration ---
    public OwnerRaceMeetingRegistrationDTO toDTO(OwnerRaceMeetingRegistration reg, String ownerName, String meetingName) {
        if (reg == null) {
            return null;
        }
        return OwnerRaceMeetingRegistrationDTO.builder()
                .id(reg.getId())
                .raceMeetingId(reg.getRaceMeetingId())
                .raceMeetingName(meetingName)
                .ownerId(reg.getOwnerId())
                .ownerName(ownerName)
                .status(reg.getStatus())
                .registeredAt(reg.getRegisteredAt())
                .build();
    }

    public OwnerRaceMeetingRegistration toEntity(OwnerRaceMeetingRegistrationDTO dto) {
        if (dto == null) {
            return null;
        }
        OwnerRaceMeetingRegistration reg = new OwnerRaceMeetingRegistration();
        reg.setId(dto.getId());
        reg.setRaceMeetingId(dto.getRaceMeetingId());
        reg.setOwnerId(dto.getOwnerId());
        reg.setStatus(dto.getStatus());
        reg.setRegisteredAt(dto.getRegisteredAt());
        return reg;
    }

    // --- Horse Registration ---
    public HorseRaceMeetingRegistrationDTO toDTO(HorseRaceMeetingRegistration reg, String horseName, String meetingName) {
        if (reg == null) {
            return null;
        }
        return HorseRaceMeetingRegistrationDTO.builder()
                .id(reg.getId())
                .raceMeetingId(reg.getRaceMeetingId())
                .raceMeetingName(meetingName)
                .horseId(reg.getHorseId())
                .horseName(horseName)
                .status(reg.getStatus())
                .registeredAt(reg.getRegisteredAt())
                .build();
    }

    public HorseRaceMeetingRegistration toEntity(HorseRaceMeetingRegistrationDTO dto) {
        if (dto == null) {
            return null;
        }
        HorseRaceMeetingRegistration reg = new HorseRaceMeetingRegistration();
        reg.setId(dto.getId());
        reg.setRaceMeetingId(dto.getRaceMeetingId());
        reg.setHorseId(dto.getHorseId());
        reg.setStatus(dto.getStatus());
        reg.setRegisteredAt(dto.getRegisteredAt());
        return reg;
    }

    // --- Generic Registration ---
    public RegistrationDTO toGenericDTO(JockeyRaceMeetingRegistration reg, String jockeyName, String meetingName) {
        if (reg == null) {
            return null;
        }
        return RegistrationDTO.builder()
                .id(reg.getId())
                .raceMeetingId(reg.getRaceMeetingId())
                .raceMeetingName(meetingName)
                .type("JOCKEY")
                .targetId(reg.getJockeyId())
                .targetName(jockeyName)
                .status(reg.getStatus())
                .registeredAt(reg.getRegisteredAt())
                .build();
    }

    public RegistrationDTO toGenericDTO(OwnerRaceMeetingRegistration reg, String ownerName, String meetingName) {
        if (reg == null) {
            return null;
        }
        return RegistrationDTO.builder()
                .id(reg.getId())
                .raceMeetingId(reg.getRaceMeetingId())
                .raceMeetingName(meetingName)
                .type("OWNER")
                .targetId(reg.getOwnerId())
                .targetName(ownerName)
                .status(reg.getStatus())
                .registeredAt(reg.getRegisteredAt())
                .build();
    }

    public RegistrationDTO toGenericDTO(HorseRaceMeetingRegistration reg, String horseName, String meetingName) {
        if (reg == null) {
            return null;
        }
        return RegistrationDTO.builder()
                .id(reg.getId())
                .raceMeetingId(reg.getRaceMeetingId())
                .raceMeetingName(meetingName)
                .type("HORSE")
                .targetId(reg.getHorseId())
                .targetName(horseName)
                .status(reg.getStatus())
                .registeredAt(reg.getRegisteredAt())
                .build();
    }
}
