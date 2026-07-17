package model.DTO;

import java.io.Serializable;
import java.sql.Timestamp;
import javax.persistence.*;

@Entity
@Table(name = "HorseRaceMeetingRegistration")
public class HorseRaceMeetingRegistrationDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "race_meeting_id")
    private Integer raceMeetingId;

    @Column(name = "horse_id")
    private Integer horseId;

    @Column(name = "status")
    private String status;

    @Column(name = "registered_at")
    private Timestamp registeredAt;

    public HorseRaceMeetingRegistrationDTO() {
    }

    public HorseRaceMeetingRegistrationDTO(Integer id, Integer raceMeetingId, Integer horseId, String status, Timestamp registeredAt) {
        this.id = id;
        this.raceMeetingId = raceMeetingId;
        this.horseId = horseId;
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

    public Integer getHorseId() {
        return horseId;
    }

    public void setHorseId(Integer horseId) {
        this.horseId = horseId;
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
