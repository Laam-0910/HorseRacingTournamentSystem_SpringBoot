package com.horseracing.backend.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "LivestreamSubscription")
public class LivestreamSubscription implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "package_type", nullable = false)
    private String packageType; // 'RACEMEETING' or 'SEASON'

    @Column(name = "season_id")
    private Integer seasonId;

    @Column(name = "race_meeting_id")
    private Integer raceMeetingId;

    @Column(name = "price_paid", nullable = false, precision = 18, scale = 2)
    private BigDecimal pricePaid;

    @Column(name = "discount_applied", precision = 18, scale = 2)
    private BigDecimal discountApplied = BigDecimal.ZERO;

    @Column(name = "purchase_time")
    private Timestamp purchaseTime;

    @Column(name = "expires_at")
    private Timestamp expiresAt;

    @Column(name = "payment_method")
    private String paymentMethod = "VIETQR";
}
