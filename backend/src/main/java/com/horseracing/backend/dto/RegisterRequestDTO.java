package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequestDTO {
    private String username;
    private String fullName;     // Tên hiển thị (khác với username đăng nhập)
    private String password;
    private String email;
    private Integer roleId;
    private BigDecimal weight; // Chỉ có ý nghĩa nếu đăng ký làm Jockey
}
