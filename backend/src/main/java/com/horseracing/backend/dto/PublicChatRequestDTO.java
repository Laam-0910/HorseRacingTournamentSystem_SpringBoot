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
public class PublicChatRequestDTO {
    @Schema(description = "Nội dung câu hỏi", example = "Ngựa nào có rating cao nhất?")
    private String message;

    @Schema(description = "Ngôn ngữ (vi hoặc en)", example = "vi")
    private String lang;
}
