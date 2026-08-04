package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiChatRequestDTO {
        private String message;

        private String sessionId;

        private String lang;

        // User context injected by frontend for AI personalization
        private Integer userId;
        private String fullName;
        private String roleName;
        private Double walletBalance;
}
