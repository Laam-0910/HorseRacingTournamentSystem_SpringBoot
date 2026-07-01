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

    @Column(name = "require_otp")
    private Boolean requireOtp = false;





















}
