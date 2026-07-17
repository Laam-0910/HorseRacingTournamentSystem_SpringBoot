package model.DTO;

import java.io.Serializable;
import java.sql.Date;
import javax.persistence.*;

@Entity
@Table(name = "Horse")
public class HorseDTO implements Serializable {

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

    public HorseDTO() {
    }

    public HorseDTO(Integer id, Integer ownerId, String name, String breed, Date dateOfBirth, String status, Integer currentRating, Integer totalRaces, Integer totalWins) {
        this.id = id;
        this.ownerId = ownerId;
        this.name = name;
        this.breed = breed;
        this.dateOfBirth = dateOfBirth;
        this.status = status;
        this.currentRating = currentRating;
        this.totalRaces = totalRaces;
        this.totalWins = totalWins;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(Integer ownerId) {
        this.ownerId = ownerId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getBreed() {
        return breed;
    }

    public void setBreed(String breed) {
        this.breed = breed;
    }

    public Date getDateOfBirth() {
        return dateOfBirth;
    }

    public void setDateOfBirth(Date dateOfBirth) {
        this.dateOfBirth = dateOfBirth;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Integer getCurrentRating() {
        return currentRating;
    }

    public void setCurrentRating(Integer currentRating) {
        this.currentRating = currentRating;
    }

    public Integer getTotalRaces() {
        return totalRaces;
    }

    public void setTotalRaces(Integer totalRaces) {
        this.totalRaces = totalRaces;
    }

    public Integer getTotalWins() {
        return totalWins;
    }

    public void setTotalWins(Integer totalWins) {
        this.totalWins = totalWins;
    }

    @Override
    public String toString() {
        return "HorseDTO{" + "id=" + id + ", ownerId=" + ownerId + ", name=" + name + ", breed=" + breed + ", dateOfBirth=" + dateOfBirth + ", status=" + status + ", currentRating=" + currentRating + ", totalRaces=" + totalRaces + ", totalWins=" + totalWins + "}";
    }
}
