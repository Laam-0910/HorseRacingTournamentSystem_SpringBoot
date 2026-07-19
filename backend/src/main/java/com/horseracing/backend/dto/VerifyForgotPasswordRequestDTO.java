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
public class VerifyForgotPasswordRequestDTO {
    @Schema(description = "Mã giao dịch OTP nhận được khi yêu cầu quên mật khẩu", example = "otp-tx-123456")
    private String otpTxId;

    @Schema(description = "Mã OTP 6 chữ số", example = "123456")
    private String otp;

    @Schema(description = "Mật khẩu mới muốn đặt lại", example = "newpassword123")
    private String newPassword;
}
