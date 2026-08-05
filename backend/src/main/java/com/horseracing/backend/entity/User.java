package com.horseracing.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.math.BigDecimal;
import jakarta.persistence.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "[User]")
@Cacheable(false)
public class User implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "role_id")
    private Integer roleId;

    @Column(name = "username")
    private String username;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "email")
    private String email;

    @Column(name = "weight")
    private BigDecimal weight;

    @Column(name = "total_races_participated")
    private Integer totalRacesParticipated;

    @Column(name = "total_top3_finishes")
    private Integer totalTop3Finishes;

    @Column(name = "status")
    private String status;

    @Column(name = "wallet_balance", precision = 18, scale = 2)
    private BigDecimal balance = BigDecimal.ZERO;

    public BigDecimal getWalletBalance() {
        return balance != null ? balance : BigDecimal.ZERO;
    }

    public void setWalletBalance(BigDecimal walletBalance) {
        if (walletBalance != null) {
            this.balance = walletBalance.setScale(2, java.math.RoundingMode.HALF_UP);
        } else {
            this.balance = BigDecimal.ZERO.setScale(2, java.math.RoundingMode.HALF_UP);
        }
    }

    @Column(name = "require_otp")
    private Boolean requireOtp = false;

    @Column(name = "avatar", columnDefinition = "VARCHAR(MAX)")
    private String avatar;

    @Column(name = "full_name")
    private String fullName;

    @Column(name = "biography", columnDefinition = "NVARCHAR(MAX)")
    private String biography;

    @Column(name = "jockey_fee", precision = 12, scale = 2)
    private BigDecimal jockeyFee = new BigDecimal("500000.00");
}
