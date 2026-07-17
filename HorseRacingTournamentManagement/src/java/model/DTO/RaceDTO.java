package model.DTO;

import java.io.Serializable;
import java.math.BigDecimal;
import java.sql.Timestamp;
import javax.persistence.*;

@Entity
@Table(name = "Race")
public class RaceDTO implements Serializable {

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

    public RaceDTO() {
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getRaceMeetingId() {
        return raceMeetingId;
    }

    public void setRaceMeetingId(Integer raceMeetingId) {
        this.raceMeetingId = raceMeetingId;
    }

    public Timestamp getStartTime() {
        return startTime;
    }

    public void setStartTime(Timestamp startTime) {
        this.startTime = startTime;
    }

    public Timestamp getRegistrationStartTime() {
        return registrationStartTime;
    }

    public void setRegistrationStartTime(Timestamp registrationStartTime) {
        this.registrationStartTime = registrationStartTime;
    }

    public Timestamp getRegistrationEndTime() {
        return registrationEndTime;
    }

    public void setRegistrationEndTime(Timestamp registrationEndTime) {
        this.registrationEndTime = registrationEndTime;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getClassLevel() {
        return classLevel;
    }

    public void setClassLevel(String classLevel) {
        this.classLevel = classLevel;
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

    public Integer getDistanceMeters() {
        return distanceMeters;
    }

    public void setDistanceMeters(Integer distanceMeters) {
        this.distanceMeters = distanceMeters;
    }

    public String getTrackType() {
        return trackType;
    }

    public void setTrackType(String trackType) {
        this.trackType = trackType;
    }

    public BigDecimal getPurse() {
        return purse;
    }

    public void setPurse(BigDecimal purse) {
        this.purse = purse;
    }

    public Integer getMaxEntries() {
        return maxEntries;
    }

    public void setMaxEntries(Integer maxEntries) {
        this.maxEntries = maxEntries;
    }

    public String getStewardReport() {
        return stewardReport;
    }

    public void setStewardReport(String stewardReport) {
        this.stewardReport = stewardReport;
    }

    public String getYoutubeLiveUrl() {
        return youtubeLiveUrl;
    }

    public void setYoutubeLiveUrl(String youtubeLiveUrl) {
        this.youtubeLiveUrl = youtubeLiveUrl;
    }
}

