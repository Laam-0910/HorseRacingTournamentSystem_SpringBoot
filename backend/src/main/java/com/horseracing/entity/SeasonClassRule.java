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
@Table(name = "SeasonClassRule")
public class SeasonClassRule implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "season_id")
    private Integer seasonId;

    @Column(name = "class_level")
    private String classLevel;

    @Column(name = "class_name")
    private String className;

    @Column(name = "min_rating")
    private Integer minRating;

    @Column(name = "max_rating")
    private Integer maxRating;

    @Column(name = "min_prize")
    private BigDecimal minPrize;

    @Column(name = "max_prize")
    private BigDecimal maxPrize;

















}
