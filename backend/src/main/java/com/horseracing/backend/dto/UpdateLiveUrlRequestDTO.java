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
public class UpdateLiveUrlRequestDTO {
    @Schema(description = "Đường dẫn Youtube Livestream", example = "https://www.youtube.com/watch?v=dQw4w9WgXcQ")
    private String youtubeLiveUrl;
}
