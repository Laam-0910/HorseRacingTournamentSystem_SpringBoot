package com.horseracing.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDTO {
    private Boolean success;
    private String token;
    private UserDTO user;
    private String error;
    private Boolean requireOtp;
    private String otpTxId;
}
