package com.horseracing.backend.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.io.Serializable;
import java.sql.Date;
import jakarta.persistence.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "Horse")
public class Horse implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "owner_id")
    private Integer ownerId;

    @Column(name = "name")
    private String name;

    @Column(name = "breed")
    private String breed;

    @Column(name = "date_of_birth")
    private Date dateOfBirth;

    @Column(name = "status")
    private String status;

    @Column(name = "current_rating")
    private Integer currentRating;

    @Column(name = "total_races")
    private Integer totalRaces;

    @Column(name = "total_wins")
    private Integer totalWins;

















}
