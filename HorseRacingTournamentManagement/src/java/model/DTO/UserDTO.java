package model.DTO;

import java.io.Serializable;
import java.math.BigDecimal;
import javax.persistence.*;

@Entity
@Table(name = "[User]")
@Cacheable(false)
public class UserDTO implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "role_id")
    private Integer roleId;

    @Column(name = "username")
    private String username;

    @Column(name = "password_hash")
    private String passwordHash;

    @Column(name = "email")
    private String email;

    @Column(name = "weight")
    private BigDecimal weight;

    @Column(name = "total_races_participated")
    private Integer totalRacesParticipated;

    @Column(name = "total_top3_finishes")
    private Integer totalTop3Finishes;

    @Column(name = "status")
    private String status;

    @Column(name = "require_otp")
    private Boolean requireOtp = false;

    public UserDTO() {
    }

    public Boolean getRequireOtp() {
        return requireOtp;
    }

    public void setRequireOtp(Boolean requireOtp) {
        this.requireOtp = requireOtp;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public Integer getRoleId() {
        return roleId;
    }

    public void setRoleId(Integer roleId) {
        this.roleId = roleId;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public BigDecimal getWeight() {
        return weight;
    }

    public void setWeight(BigDecimal weight) {
        this.weight = weight;
    }

    public Integer getTotalRacesParticipated() {
        return totalRacesParticipated;
    }

    public void setTotalRacesParticipated(Integer totalRacesParticipated) {
        this.totalRacesParticipated = totalRacesParticipated;
    }

    public Integer getTotalTop3Finishes() {
        return totalTop3Finishes;
    }

    public void setTotalTop3Finishes(Integer totalTop3Finishes) {
        this.totalTop3Finishes = totalTop3Finishes;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
