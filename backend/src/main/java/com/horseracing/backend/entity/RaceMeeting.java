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
@Table(name = "RaceMeeting")
public class RaceMeeting implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "season_id")
    private Integer seasonId;

    @Column(name = "name")
    private String name;

    @Column(name = "start_date")
    private Timestamp startDate;

    @Column(name = "venue")
    private String venue;

    @Column(name = "total_budget")
    private BigDecimal totalBudget;

    @Column(name = "ticket_price")
    private BigDecimal ticketPrice;

    @Column(name = "ticket_settled")
    private Boolean ticketSettled = false;

    @Column(name = "status")
    private String status = "ACTIVE";

    @Column(name = "last_allocated_budget")
    private BigDecimal lastAllocatedBudget;

    @PrePersist
    @PreUpdate
    public void ensureDefaults() {
        if (ticketSettled == null) {
            ticketSettled = false;
        }
        if (status == null || status.trim().isEmpty()) {
            status = "ACTIVE";
        }
    }













}
