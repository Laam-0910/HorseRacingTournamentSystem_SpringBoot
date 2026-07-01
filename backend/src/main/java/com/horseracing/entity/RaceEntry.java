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
@Table(name = "RaceEntry")
public class RaceEntry implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "race_id")
    private Integer raceId;

    @Column(name = "horse_id")
    private Integer horseId;

    @Column(name = "jockey_id")
    private Integer jockeyId;

    @Column(name = "gate_number")
    private Integer gateNumber;

    @Column(name = "status")
    private String status;

    @Column(name = "final_position")
    private Integer finalPosition;

    @Column(name = "finish_time")
    private String finishTime;

    @Column(name = "prize_money")
    private BigDecimal prizeMoney;

    @Column(name = "carried_weight")
    private BigDecimal carriedWeight;

    @Column(name = "rating_adjustment")
    private Integer ratingAdjustment;

    @Column(name = "handicap_weight")
    private BigDecimal handicapWeight;

























}
