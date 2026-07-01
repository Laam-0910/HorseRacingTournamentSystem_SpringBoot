package com.horseracing.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.sql.Timestamp;
import jakarta.persistence.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "OwnerRaceMeetingRegistration")
public class OwnerRaceMeetingRegistration implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "race_meeting_id")
    private Integer raceMeetingId;

    @Column(name = "owner_id")
    private Integer ownerId;

    @Column(name = "status")
    private String status;

    @Column(name = "registered_at")
    private Timestamp registeredAt;












}
