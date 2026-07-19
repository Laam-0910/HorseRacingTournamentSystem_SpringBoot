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
public class ToggleOtpRequestDTO {
    @Schema(description = "Tên đăng nhập (username) người dùng", example = "admin")
    private String username;

    @Schema(description = "Trạng thái bật/tắt OTP 2FA", example = "true")
    private Boolean requireOtp;
}
