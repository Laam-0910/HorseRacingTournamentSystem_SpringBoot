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
public class VerifyOtpRequestDTO {
    @Schema(description = "Mã giao dịch OTP nhận được từ bước trước", example = "otp-tx-123456")
    private String otpTxId;

    @Schema(description = "Mã OTP 6 chữ số", example = "123456")
    private String otp;
}
