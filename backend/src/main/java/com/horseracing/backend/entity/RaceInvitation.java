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
@Table(name = "RaceInvitation")
public class RaceInvitation implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "race_id")
    private Integer raceId;

    @Column(name = "horse_id")
    private Integer horseId;

    @Column(name = "owner_id")
    private Integer ownerId;

    @Column(name = "jockey_id")
    private Integer jockeyId;

    @Column(name = "status")
    private String status;

    @Column(name = "jockey_share_percentage", precision = 5, scale = 2)
    private BigDecimal jockeySharePercentage = new BigDecimal("10.00");

    @Column(name = "commission_amount")
    private java.math.BigDecimal commissionAmount;

    @Column(name = "commission_rate")
    private java.math.BigDecimal commissionRate;

    @Column(name = "payout_status")
    private String payoutStatus = "PENDING";

    @Column(name = "hire_fee")
    private java.math.BigDecimal hireFee = new java.math.BigDecimal("500.00");
}
