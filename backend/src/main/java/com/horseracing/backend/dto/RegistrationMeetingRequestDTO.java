package com.horseracing.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegistrationMeetingRequestDTO {
    @Schema(description = "ID Ngày đua (Race Meeting)", example = "1")
    private Integer meetingId;

    @Schema(description = "ID Nài ngựa (Jockey)", example = "1")
    private Integer jockeyId;

    @Schema(description = "ID Chủ ngựa (Owner)", example = "1")
    private Integer ownerId;

    @Schema(description = "ID Ngựa (Horse)", example = "1")
    private Integer horseId;
}
