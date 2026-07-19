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
public class CreateUserRequestDTO {
    @Schema(description = "Tên đăng nhập", example = "jockey_new")
    private String username;

    @Schema(description = "Email", example = "jockey@example.com")
    private String email;

    @Schema(description = "Mật khẩu", example = "password123")
    private String password;

    @Schema(description = "ID vai trò (1: Admin, 2: Owner, 3: Jockey, 4: Spectator, 5: Referee)", example = "3")
    private Integer roleId;

    @Schema(description = "Cân nặng (Dành riêng cho Nài ngựa Jockey)", example = "52.5")
    private BigDecimal weight;
}
