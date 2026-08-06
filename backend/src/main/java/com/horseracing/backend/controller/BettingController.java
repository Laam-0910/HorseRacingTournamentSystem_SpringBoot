package com.horseracing.backend.controller;

import com.horseracing.backend.dto.BetDTO;
import com.horseracing.backend.service.BettingService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/betting")
@RequiredArgsConstructor
public class BettingController {

    private final BettingService bettingService;

    /**
     * Get odds for all horses in a race (public endpoint).
     */
    @GetMapping("/odds/{raceId}")
    public ResponseEntity<?> getOdds(@PathVariable Integer raceId) {
        try {
            return ResponseEntity.ok(bettingService.getOddsForRace(raceId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Place a bet (authenticated spectator only).
     * Body: { userId, raceId, horseId, amount }
     */
    @PostMapping("/place")
    public ResponseEntity<?> placeBet(@RequestBody Map<String, Object> body) {
        try {
            Integer userId = Integer.parseInt(body.get("userId").toString());
            Integer raceId = Integer.parseInt(body.get("raceId").toString());
            Integer horseId = Integer.parseInt(body.get("horseId").toString());
            BigDecimal amount = new BigDecimal(body.get("amount").toString());

            BetDTO bet = bettingService.placeBet(userId, raceId, horseId, amount);
            return ResponseEntity.ok(bet);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get logged-in user's bet history.
     */
    @GetMapping("/my-bets")
    public ResponseEntity<?> getMyBets(@RequestParam Integer userId) {
        try {
            return ResponseEntity.ok(bettingService.getMyBets(userId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Get logged-in user's bets for a specific race.
     */
    @GetMapping("/my-bets/{raceId}")
    public ResponseEntity<?> getMyBetsForRace(@RequestParam Integer userId,
                                               @PathVariable Integer raceId) {
        try {
            return ResponseEntity.ok(bettingService.getMyBetsForRace(userId, raceId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Admin: Get all bets for a race.
     */
    @GetMapping("/admin/race/{raceId}")
    public ResponseEntity<?> getAdminBetsForRace(@PathVariable Integer raceId) {
        try {
            return ResponseEntity.ok(bettingService.getBetsForRace(raceId));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Admin: Get betting stats summary.
     */
    @GetMapping("/admin/stats")
    public ResponseEntity<?> getAdminStats() {
        try {
            return ResponseEntity.ok(bettingService.getAdminBettingStats());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    /**
     * Test endpoint: Force settle all pending bets as WINNERS for quick verification.
     */
    @PostMapping("/test/win-all-bets")
    public ResponseEntity<?> forceWinAllBets() {
        try {
            return ResponseEntity.ok(bettingService.forceSettleWinningBets());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
