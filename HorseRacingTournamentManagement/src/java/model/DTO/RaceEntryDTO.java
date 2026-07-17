package model.DTO;

import java.io.Serializable;
import java.math.BigDecimal;
import javax.persistence.*;

@Entity
@Table(name = "RaceEntry")
public class RaceEntryDTO implements Serializable {

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

    public RaceEntryDTO() {
    }

    public BigDecimal getHandicapWeight() {
        return handicapWeight;
    }

    public void setHandicapWeight(BigDecimal handicapWeight) {
        this.handicapWeight = handicapWeight;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getRaceId() {
        return raceId;
    }

    public void setRaceId(Integer raceId) {
        this.raceId = raceId;
    }

    public Integer getHorseId() {
        return horseId;
    }

    public void setHorseId(Integer horseId) {
        this.horseId = horseId;
    }

    public Integer getJockeyId() {
        return jockeyId;
    }

    public void setJockeyId(Integer jockeyId) {
        this.jockeyId = jockeyId;
    }

    public Integer getGateNumber() {
        return gateNumber;
    }

    public void setGateNumber(Integer gateNumber) {
        this.gateNumber = gateNumber;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getFinalPosition() {
        return finalPosition;
    }

    public void setFinalPosition(Integer finalPosition) {
        this.finalPosition = finalPosition;
    }

    public String getFinishTime() {
        return finishTime;
    }

    public void setFinishTime(String finishTime) {
        this.finishTime = finishTime;
    }

    public BigDecimal getPrizeMoney() {
        return prizeMoney;
    }

    public void setPrizeMoney(BigDecimal prizeMoney) {
        this.prizeMoney = prizeMoney;
    }

    public BigDecimal getCarriedWeight() {
        return carriedWeight;
    }

    public void setCarriedWeight(BigDecimal carriedWeight) {
        this.carriedWeight = carriedWeight;
    }

    public Integer getRatingAdjustment() {
        return ratingAdjustment;
    }

    public void setRatingAdjustment(Integer ratingAdjustment) {
        this.ratingAdjustment = ratingAdjustment;
    }
}
