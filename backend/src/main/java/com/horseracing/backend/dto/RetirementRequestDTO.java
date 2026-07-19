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
public class RetirementRequestDTO {
    @Schema(description = "ID của ngựa", example = "1")
    private Integer horseId;

    @Schema(description = "Lý do giải nghệ", example = "Ngựa chấn thương chân sau")
    private String reason;
}
