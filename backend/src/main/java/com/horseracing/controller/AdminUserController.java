package com.horseracing.backend.controller;

import com.horseracing.backend.dto.SystemConfigDTO;
import com.horseracing.backend.dto.UserDTO;
import com.horseracing.backend.service.AdminUserService;
import com.horseracing.backend.service.RaceService;
import com.horseracing.backend.service.SystemConfigService;
import com.horseracing.backend.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class AdminUserController {

    private final AdminUserService adminUserService;
    private final UserService userService;
    private final SystemConfigService systemConfigService;
    private final RaceService raceService;

    // --- User Management ---
    @GetMapping("/users")
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PostMapping("/users")
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body) {
        try {
            String username = (String) body.get("username");
            String email = (String) body.get("email");
            String password = (String) body.get("password");
            Integer roleId = Integer.parseInt(String.valueOf(body.get("roleId")));
            java.math.BigDecimal weight = null;
            if (body.get("weight") != null && !String.valueOf(body.get("weight")).trim().isEmpty()) {
                weight = new java.math.BigDecimal(String.valueOf(body.get("weight")));
            }

            UserDTO created = userService.createUserManual(username, email, password, roleId, weight);
            return ResponseEntity.ok(Map.of("success", true, "user", created));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        try {
            String username = (String) body.get("username");
            String email = (String) body.get("email");
            Integer roleId = (Integer) body.get("roleId");
            Boolean requireOtp = (Boolean) body.get("requireOtp");
            java.math.BigDecimal weight = null;
            if (body.get("weight") != null && !String.valueOf(body.get("weight")).trim().isEmpty()) {
                weight = new java.math.BigDecimal(String.valueOf(body.get("weight")));
            }

            UserDTO updated = userService.updateUser(id, username, email, roleId, requireOtp, weight);
            return ResponseEntity.ok(Map.of("success", true, "user", updated));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/users/{id}/toggle")
    public ResponseEntity<?> toggleUserStatus(@PathVariable Integer id) {
        try {
            String status = userService.toggleUserStatus(id);
            return ResponseEntity.ok(Map.of("success", true, "status", status));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- Race & Referee Assignment ---
    @PostMapping("/races/{raceId}/referee")
    public ResponseEntity<?> assignReferee(@PathVariable Integer raceId, @RequestBody Map<String, Integer> body) {
        try {
            Integer refereeId = body.get("refereeId");
            adminUserService.assignReferee(raceId, refereeId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/referee/remove")
    public ResponseEntity<?> removeReferee(@PathVariable Integer raceId, @RequestBody Map<String, Integer> body) {
        try {
            Integer refereeId = body.get("refereeId");
            adminUserService.removeReferee(raceId, refereeId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @GetMapping("/races/referees")
    public ResponseEntity<?> getRaceReferees() {
        return ResponseEntity.ok(adminUserService.getRaceRefereesMap());
    }

    // --- Livestream ---
    @PostMapping("/races/{raceId}/live")
    public ResponseEntity<?> setLiveUrl(@PathVariable Integer raceId, @RequestBody Map<String, String> body) {
        try {
            raceService.updateRace(raceId, Map.of("youtubeLiveUrl", body.get("youtubeLiveUrl")));
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/live/remove")
    public ResponseEntity<?> removeLiveUrl(@PathVariable Integer raceId) {
        try {
            raceService.updateRace(raceId, Map.of("youtubeLiveUrl", "")); // Trống
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- System Config ---
    @GetMapping("/configs")
    public ResponseEntity<List<SystemConfigDTO>> getConfigs() {
        return ResponseEntity.ok(systemConfigService.getAllConfigs());
    }

    @PostMapping("/configs")
    public ResponseEntity<?> updateConfigs(@RequestBody Map<String, String> body) {
        try {
            systemConfigService.updateConfigs(body);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- Registrations & Approvals ---
    @GetMapping("/pending-registrations")
    public ResponseEntity<?> getPendingRegistrations() {
        try {
            Map<String, Object> pending = adminUserService.getPendingRegistrations();
            return ResponseEntity.ok(pending);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entries/{id}/approve")
    public ResponseEntity<?> approveRaceEntry(@PathVariable Integer id) {
        try {
            adminUserService.approveRaceEntry(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/entries/{id}/reject")
    public ResponseEntity<?> rejectRaceEntry(@PathVariable Integer id) {
        try {
            adminUserService.rejectRaceEntry(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/jockey-reg/{id}/approve")
    public ResponseEntity<?> approveJockeyReg(@PathVariable Integer id) {
        try {
            adminUserService.approveJockeyReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/jockey-reg/{id}/reject")
    public ResponseEntity<?> rejectJockeyReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectJockeyReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/owner-reg/{id}/approve")
    public ResponseEntity<?> approveOwnerReg(@PathVariable Integer id) {
        try {
            adminUserService.approveOwnerReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/owner-reg/{id}/reject")
    public ResponseEntity<?> rejectOwnerReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectOwnerReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/horse-reg/{id}/approve")
    public ResponseEntity<?> approveHorseReg(@PathVariable Integer id) {
        try {
            adminUserService.approveHorseReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/horse-reg/{id}/reject")
    public ResponseEntity<?> rejectHorseReg(@PathVariable Integer id) {
        try {
            adminUserService.rejectHorseReg(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/system-horse/{id}/approve")
    public ResponseEntity<?> approveSystemHorse(@PathVariable Integer id) {
        try {
            adminUserService.approveSystemHorse(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/system-horse/{id}/reject")
    public ResponseEntity<?> rejectSystemHorse(@PathVariable Integer id) {
        try {
            adminUserService.rejectSystemHorse(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // --- Racecard Automation ---
    @PostMapping("/races/{raceId}/auto-assign-gates")
    public ResponseEntity<?> autoAssignGates(@PathVariable Integer raceId) {
        try {
            adminUserService.autoAssignGates(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Gates successfully auto-assigned."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/auto-calculate-weights")
    public ResponseEntity<?> autoCalculateWeights(@PathVariable Integer raceId) {
        try {
            adminUserService.autoCalculateWeights(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Handicap weights auto-calculated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/racecard")
    public ResponseEntity<?> updateRacecard(@PathVariable Integer raceId, @RequestBody List<Map<String, Object>> body) {
        try {
            adminUserService.updateRacecard(raceId, body);
            return ResponseEntity.ok(Map.of("success", true, "message", "Racecard updated successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    @PostMapping("/races/{raceId}/cancel")
    public ResponseEntity<?> cancelRace(@PathVariable Integer raceId) {
        try {
            adminUserService.cancelRace(raceId);
            return ResponseEntity.ok(Map.of("success", true, "message", "Race cancelled successfully."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
