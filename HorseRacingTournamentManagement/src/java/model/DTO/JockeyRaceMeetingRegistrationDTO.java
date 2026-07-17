package model.DTO;

import java.io.Serializable;
import java.sql.Timestamp;
import javax.persistence.*;

@Entity
@Table(name = "JockeyRaceMeetingRegistration")
public class JockeyRaceMeetingRegistrationDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "race_meeting_id")
    private Integer raceMeetingId;

    @Column(name = "jockey_id")
    private Integer jockeyId;

    @Column(name = "status")
    private String status;

    @Column(name = "registered_at")
    private Timestamp registeredAt;

    public JockeyRaceMeetingRegistrationDTO() {
    }

    public JockeyRaceMeetingRegistrationDTO(Integer id, Integer raceMeetingId, Integer jockeyId, String status, Timestamp registeredAt) {
        this.id = id;
        this.raceMeetingId = raceMeetingId;
        this.jockeyId = jockeyId;
        this.status = status;
        this.registeredAt = registeredAt;
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

    public Integer getJockeyId() {
        return jockeyId;
    }

    public void setJockeyId(Integer jockeyId) {
        this.jockeyId = jockeyId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Timestamp getRegisteredAt() {
        return registeredAt;
    }

    public void setRegisteredAt(Timestamp registeredAt) {
        this.registeredAt = registeredAt;
    }
}
