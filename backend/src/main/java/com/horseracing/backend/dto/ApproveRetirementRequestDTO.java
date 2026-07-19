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
public class ApproveRetirementRequestDTO {
    @Schema(description = "Ghi chú của Admin", example = "Đã phê duyệt giải nghệ")
    private String adminRemarks;
}
