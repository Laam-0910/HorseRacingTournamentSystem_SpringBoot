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
public class AiChatRequestDTO {
    @Schema(description = "Tin nhắn gửi cho AI Chatbot", example = "Dự đoán trận đua hôm nay")
    private String message;

    @Schema(description = "ID phiên trò chuyện", example = "session-123")
    private String sessionId;

    @Schema(description = "Ngôn ngữ trả về (vi hoặc en)", example = "vi")
    private String lang;
}
