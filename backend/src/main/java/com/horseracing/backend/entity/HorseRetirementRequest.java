package com.horseracing.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import jakarta.persistence.*;
import java.io.Serializable;
import java.sql.Timestamp;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "HorseRetirementRequest")
public class HorseRetirementRequest implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "horse_id", nullable = false)
    private Integer horseId;

    @Column(name = "owner_id", nullable = false)
    private Integer ownerId;

    @Column(name = "reason", nullable = false)
    private String reason;

    @Column(name = "status", nullable = false)
    private String status; // PENDING, APPROVED, REJECTED

    @Column(name = "admin_remarks")
    private String adminRemarks;

    @Column(name = "created_at")
    private Timestamp createdAt;

    @Column(name = "processed_at")
    private Timestamp processedAt;
}
