package com.horseracing.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConfirmResultsRequestDTO {
    @Schema(description = "ID Trận đua", example = "1")
    private Integer raceId;

    @Schema(description = "Báo cáo giám sát của Trọng tài", example = "Trận đua diễn ra công bằng, không sự cố.")
    private String stewardReport;

    @Schema(description = "Danh sách kết quả thứ hạng các ngựa")
    private List<Map<String, Object>> results;
}
