package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationMeetingRequestDTO {
        private Integer meetingId;

        private Integer jockeyId;

        private Integer ownerId;

        private Integer horseId;
}
