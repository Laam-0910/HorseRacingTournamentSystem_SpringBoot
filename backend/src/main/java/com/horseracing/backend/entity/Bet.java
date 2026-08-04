package com.horseracing.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Timestamp;
import jakarta.persistence.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Bet")
public class Bet implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "race_id", nullable = false)
    private Integer raceId;

    @Column(name = "horse_id", nullable = false)
    private Integer horseId;

    @Column(name = "amount", nullable = false, precision = 18, scale = 2)
    private BigDecimal amount;

    @Column(name = "odds", nullable = false, precision = 10, scale = 3)
    private BigDecimal odds;

    @Column(name = "status")
    private String status = "PENDING";

    @Column(name = "payout", precision = 18, scale = 2)
    private BigDecimal payout = BigDecimal.ZERO;

    @Column(name = "created_at")
    private Timestamp createdAt;
}
