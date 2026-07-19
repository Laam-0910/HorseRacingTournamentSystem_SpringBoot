package com.horseracing.backend.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequestDTO {
    @Schema(description = "Tên đăng nhập", example = "jockey_1")
    private String username;

    @Schema(description = "Email", example = "jockey1@example.com")
    private String email;

    @Schema(description = "ID vai trò", example = "3")
    private Integer roleId;

    @Schema(description = "Bật/tắt OTP 2FA", example = "false")
    private Boolean requireOtp;

    @Schema(description = "Cân nặng", example = "53.0")
    private BigDecimal weight;
}
