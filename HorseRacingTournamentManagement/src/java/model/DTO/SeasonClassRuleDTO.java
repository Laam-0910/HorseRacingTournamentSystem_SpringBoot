package model.DTO;

import java.io.Serializable;
import java.math.BigDecimal;
import javax.persistence.*;

@Entity
@Table(name = "SeasonClassRule")
public class SeasonClassRuleDTO implements Serializable {

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

    public SeasonClassRuleDTO() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getSeasonId() {
        return seasonId;
    }

    public void setSeasonId(Integer seasonId) {
        this.seasonId = seasonId;
    }

    public String getClassLevel() {
        return classLevel;
    }

    public void setClassLevel(String classLevel) {
        this.classLevel = classLevel;
    }

    public String getClassName() {
        return className;
    }

    public void setClassName(String className) {
        this.className = className;
    }

    public Integer getMinRating() {
        return minRating;
    }

    public void setMinRating(Integer minRating) {
        this.minRating = minRating;
    }

    public Integer getMaxRating() {
        return maxRating;
    }

    public void setMaxRating(Integer maxRating) {
        this.maxRating = maxRating;
    }

    public BigDecimal getMinPrize() {
        return minPrize;
    }

    public void setMinPrize(BigDecimal minPrize) {
        this.minPrize = minPrize;
    }

    public BigDecimal getMaxPrize() {
        return maxPrize;
    }

    public void setMaxPrize(BigDecimal maxPrize) {
        this.maxPrize = maxPrize;
    }
}
