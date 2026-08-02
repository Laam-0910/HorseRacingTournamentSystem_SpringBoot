package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.RaceMeetingDTO;
import com.horseracing.backend.entity.RaceMeeting;
import org.springframework.stereotype.Component;

@Component
public class RaceMeetingMapper {

    public RaceMeetingDTO toDTO(RaceMeeting meeting, String seasonName, String seasonStatus) {
        if (meeting == null) {
            return null;
        }
        return RaceMeetingDTO.builder()
                .id(meeting.getId())
                .seasonId(meeting.getSeasonId())
                .seasonName(seasonName)
                .name(meeting.getName())
                .startDate(meeting.getStartDate())
                .venue(meeting.getVenue())
                .totalBudget(meeting.getTotalBudget())
                .ticketPrice(meeting.getTicketPrice())
                .ticketSettled(meeting.getTicketSettled())
                .status(meeting.getStatus() != null ? meeting.getStatus() : "ACTIVE")
                .seasonStatus(seasonStatus)
                .build();
    }

    public RaceMeetingDTO toDTO(RaceMeeting meeting, String seasonName) {
        return toDTO(meeting, seasonName, null);
    }

    public RaceMeetingDTO toDTO(RaceMeeting meeting) {
        return toDTO(meeting, null, null);
    }

    public RaceMeeting toEntity(RaceMeetingDTO dto) {
        if (dto == null) {
            return null;
        }
        RaceMeeting meeting = new RaceMeeting();
        meeting.setId(dto.getId());
        meeting.setSeasonId(dto.getSeasonId());
        meeting.setName(dto.getName());
        meeting.setStartDate(dto.getStartDate());
        meeting.setVenue(dto.getVenue());
        meeting.setTotalBudget(dto.getTotalBudget());
        meeting.setTicketPrice(dto.getTicketPrice());
        meeting.setTicketSettled(dto.getTicketSettled() != null ? dto.getTicketSettled() : false);
        meeting.setStatus(dto.getStatus() != null ? dto.getStatus() : "ACTIVE");
        return meeting;
    }
}
