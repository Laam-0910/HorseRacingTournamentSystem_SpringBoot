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
@Table(name = "Race")
public class Race implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "race_meeting_id")
    private Integer raceMeetingId;

    @Column(name = "start_time")
    private Timestamp startTime;

    @Column(name = "registration_start_time")
    private Timestamp registrationStartTime;

    @Column(name = "registration_end_time")
    private Timestamp registrationEndTime;

    @Column(name = "status")
    private String status;

    @Column(name = "class_level")
    private String classLevel;

    @Column(name = "min_rating")
    private Integer minRating;

    @Column(name = "max_rating")
    private Integer maxRating;

    @Column(name = "distance_meters")
    private Integer distanceMeters;

    @Column(name = "track_type")
    private String trackType;

    @Column(name = "purse")
    private BigDecimal purse;

    @Column(name = "max_entries")
    private Integer maxEntries;

    @Column(name = "steward_report")
    private String stewardReport;

    @Column(name = "youtube_live_url")
    private String youtubeLiveUrl;































}

