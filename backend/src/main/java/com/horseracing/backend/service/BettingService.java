package com.horseracing.backend.service;

import com.horseracing.backend.dto.BetDTO;
import com.horseracing.backend.entity.*;
import com.horseracing.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BettingService {

    private final BetRepository betRepository;
    private final RaceRepository raceRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final HorseRepository horseRepository;
    private final UserRepository userRepository;
    private final WalletTransactionRepository walletTransactionRepository;

    private static final BigDecimal MIN_BET = new BigDecimal("10000");
    private static final BigDecimal MAX_BET = new BigDecimal("10000000");

    /**
     * Calculate odds for all horses in a race.
     * Formula:
     *   probability_i = rating_i / sum(all ratings)
     *   fair_odds_i = 1 / probability_i
     *   overround = 1.10 + (N - 2) * 0.01   (scales with number of horses)
     *   display_odds_i = fair_odds_i / overround
     *   minimum display odds = 1.05
     */
    public List<Map<String, Object>> getOddsForRace(Integer raceId) {
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));

        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        // Filter to only APPROVED entries
        entries = entries.stream()
                .filter(e -> "APPROVED".equalsIgnoreCase(e.getStatus()))
                .collect(Collectors.toList());

        if (entries.isEmpty()) {
            return Collections.emptyList();
        }

        int N = entries.size();

        // Collect horse ratings
        Map<Integer, Horse> horseMap = new HashMap<>();
        double totalRating = 0;
        for (RaceEntry entry : entries) {
            Horse horse = horseRepository.findById(entry.getHorseId()).orElse(null);
            if (horse != null) {
                horseMap.put(entry.getHorseId(), horse);
                int rating = horse.getCurrentRating() != null ? horse.getCurrentRating() : 52;
                totalRating += rating;
            }
        }

        // Calculate overround based on number of horses
        // 2 horses: 1.10, 6 horses: 1.14, 10 horses: 1.18, 14 horses: 1.22
        double overround = 1.10 + (N - 2) * 0.01;

        List<Map<String, Object>> result = new ArrayList<>();
        for (RaceEntry entry : entries) {
            Horse horse = horseMap.get(entry.getHorseId());
            if (horse == null) continue;

            int rating = horse.getCurrentRating() != null ? horse.getCurrentRating() : 52;
            double probability = rating / totalRating;
            double fairOdds = 1.0 / probability;
            double displayOdds = fairOdds / overround;

            // Minimum odds 1.05
            if (displayOdds < 1.05) displayOdds = 1.05;

            // Get jockey info
            User jockey = entry.getJockeyId() != null ?
                    userRepository.findById(entry.getJockeyId()).orElse(null) : null;

            Map<String, Object> oddsEntry = new LinkedHashMap<>();
            oddsEntry.put("horseId", horse.getId());
            oddsEntry.put("horseName", horse.getName());
            oddsEntry.put("horseRating", rating);
            oddsEntry.put("horseAvatar", horse.getAvatar());
            oddsEntry.put("jockeyId", entry.getJockeyId());
            oddsEntry.put("jockeyName", jockey != null ? (jockey.getFullName() != null ? jockey.getFullName() : jockey.getUsername()) : "N/A");
            oddsEntry.put("gateNumber", entry.getGateNumber());
            oddsEntry.put("probability", Math.round(probability * 10000.0) / 100.0); // percentage with 2 decimals
            oddsEntry.put("odds", new BigDecimal(displayOdds).setScale(2, RoundingMode.HALF_UP));
            oddsEntry.put("entryId", entry.getId());
            result.add(oddsEntry);
        }

        // Sort by probability descending (favorite first)
        result.sort((a, b) -> Double.compare(
                ((Number) b.get("probability")).doubleValue(),
                ((Number) a.get("probability")).doubleValue()));

        return result;
    }

    /**
     * Place a bet. Validates user role, race status, balance, and limits.
     */
    @Transactional
    public BetDTO placeBet(Integer userId, Integer raceId, Integer horseId, BigDecimal amount) {
        // Validate user exists and is a Spectator (roleId = 4)
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (user.getRoleId() == null || user.getRoleId() != 4) {
            throw new IllegalArgumentException("Only Spectators can place bets.");
        }

        // Validate race exists and is available for betting
        Race race = raceRepository.findById(raceId)
                .orElseThrow(() -> new IllegalArgumentException("Race not found"));
        java.util.List<String> validStatuses = java.util.Arrays.asList("SCHEDULED", "DECLARATION_OPEN", "DECLARATION_CLOSED");
        if (race.getStatus() == null || !validStatuses.contains(race.getStatus().toUpperCase())) {
            throw new IllegalArgumentException("Betting is closed for this race. Current status: " + race.getStatus());
        }

        // Validate horse is in this race
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        boolean horseInRace = entries.stream()
                .anyMatch(e -> e.getHorseId().equals(horseId) && "APPROVED".equalsIgnoreCase(e.getStatus()));
        if (!horseInRace) {
            throw new IllegalArgumentException("This horse is not registered in this race.");
        }

        // Validate bet amount
        if (amount.compareTo(MIN_BET) < 0) {
            throw new IllegalArgumentException("Minimum bet is " + MIN_BET.toPlainString() + " VND.");
        }
        if (amount.compareTo(MAX_BET) > 0) {
            throw new IllegalArgumentException("Maximum bet is " + MAX_BET.toPlainString() + " VND.");
        }

        // Validate wallet balance
        BigDecimal balance = user.getWalletBalance();
        if (balance.compareTo(amount) < 0) {
            throw new IllegalArgumentException("Insufficient wallet balance. Current balance: " + balance.toPlainString() + " VND.");
        }

        // Calculate odds at time of bet
        List<Map<String, Object>> odds = getOddsForRace(raceId);
        BigDecimal betOdds = BigDecimal.ONE;
        for (Map<String, Object> o : odds) {
            if (horseId.equals(o.get("horseId"))) {
                betOdds = (BigDecimal) o.get("odds");
                break;
            }
        }

        // Deduct from wallet
        user.setWalletBalance(balance.subtract(amount));
        userRepository.save(user);

        // Record wallet transaction
        WalletTransaction tx = new WalletTransaction();
        tx.setUserId(userId);
        tx.setAmount(amount.negate());
        tx.setTransactionType("BET_PLACED");
        tx.setDescription("Bet placed on horse #" + horseId + " in race #" + raceId + " @ odds " + betOdds);
        tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        walletTransactionRepository.save(tx);

        // Create bet record
        Bet bet = new Bet();
        bet.setUserId(userId);
        bet.setRaceId(raceId);
        bet.setHorseId(horseId);
        bet.setAmount(amount);
        bet.setOdds(betOdds);
        bet.setStatus("PENDING");
        bet.setPayout(BigDecimal.ZERO);
        bet.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        bet = betRepository.save(bet);

        // Return DTO
        return toBetDTO(bet);
    }

    /**
     * Settle all bets for a race after OFFICIAL results.
     * Winners get amount * odds credited to wallet.
     */
    @Transactional
    public void settleBets(Integer raceId) {
        List<Bet> bets = betRepository.findByRaceIdAndStatus(raceId, "PENDING");
        if (bets.isEmpty()) return;

        // Find the winning horse (finalPosition = 1)
        List<RaceEntry> entries = raceEntryRepository.findByRaceId(raceId);
        Integer winningHorseId = null;
        for (RaceEntry entry : entries) {
            if (entry.getFinalPosition() != null && entry.getFinalPosition() == 1) {
                winningHorseId = entry.getHorseId();
                break;
            }
        }

        for (Bet bet : bets) {
            if (winningHorseId != null && winningHorseId.equals(bet.getHorseId())) {
                // Winner!
                BigDecimal payout = bet.getAmount().multiply(bet.getOdds()).setScale(2, RoundingMode.HALF_UP);
                bet.setStatus("WON");
                bet.setPayout(payout);

                // Credit wallet
                User user = userRepository.findById(bet.getUserId()).orElse(null);
                if (user != null) {
                    user.setWalletBalance(user.getWalletBalance().add(payout));
                    userRepository.save(user);

                    WalletTransaction tx = new WalletTransaction();
                    tx.setUserId(bet.getUserId());
                    tx.setAmount(payout);
                    tx.setTransactionType("BET_WIN");
                    tx.setDescription("Won bet on race #" + raceId + " @ odds " + bet.getOdds() + " → payout " + payout);
                    tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                    walletTransactionRepository.save(tx);
                }
            } else {
                // Loser
                bet.setStatus("LOST");
                bet.setPayout(BigDecimal.ZERO);
            }
            betRepository.save(bet);
        }
    }

    /**
     * Test Helper: Force-settle all pending bets as WINNERS for quick verification.
     */
    @Transactional
    public List<BetDTO> forceSettleWinningBets() {
        List<Bet> bets = betRepository.findAll().stream()
                .filter(b -> "PENDING".equalsIgnoreCase(b.getStatus()))
                .collect(Collectors.toList());

        for (Bet bet : bets) {
            BigDecimal payout = bet.getAmount().multiply(bet.getOdds()).setScale(2, RoundingMode.HALF_UP);
            bet.setStatus("WON");
            bet.setPayout(payout);

            // Update Race & RaceEntry
            Race race = raceRepository.findById(bet.getRaceId()).orElse(null);
            if (race != null) {
                race.setStatus("OFFICIAL");
                raceRepository.save(race);
            }
            List<RaceEntry> entries = raceEntryRepository.findByRaceId(bet.getRaceId());
            int pos = 2;
            for (RaceEntry entry : entries) {
                if (entry.getHorseId().equals(bet.getHorseId())) {
                    entry.setFinalPosition(1);
                    entry.setFinishTime("1:34.50");
                } else if (entry.getFinalPosition() == null || entry.getFinalPosition() == 1) {
                    entry.setFinalPosition(pos++);
                    entry.setFinishTime("1:36.00");
                }
                raceEntryRepository.save(entry);
            }

            // Credit spectator wallet
            User user = userRepository.findById(bet.getUserId()).orElse(null);
            if (user != null) {
                user.setWalletBalance(user.getWalletBalance().add(payout));
                userRepository.save(user);

                WalletTransaction tx = new WalletTransaction();
                tx.setUserId(bet.getUserId());
                tx.setAmount(payout);
                tx.setTransactionType("BET_WIN");
                tx.setDescription("Won bet on race #" + bet.getRaceId() + " @ odds " + bet.getOdds() + "x → Payout: " + payout + " VND");
                tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                walletTransactionRepository.save(tx);
            }
            betRepository.save(bet);
        }

        return bets.stream().map(this::toBetDTO).collect(Collectors.toList());
    }

    /**
     * Refund all pending bets for a cancelled race.
     */
    @Transactional
    public void refundBets(Integer raceId) {
        List<Bet> bets = betRepository.findByRaceIdAndStatus(raceId, "PENDING");
        for (Bet bet : bets) {
            bet.setStatus("REFUNDED");
            bet.setPayout(bet.getAmount());

            User user = userRepository.findById(bet.getUserId()).orElse(null);
            if (user != null) {
                user.setWalletBalance(user.getWalletBalance().add(bet.getAmount()));
                userRepository.save(user);

                WalletTransaction tx = new WalletTransaction();
                tx.setUserId(bet.getUserId());
                tx.setAmount(bet.getAmount());
                tx.setTransactionType("BET_REFUND");
                tx.setDescription("Refund for cancelled race #" + raceId);
                tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                walletTransactionRepository.save(tx);
            }
            betRepository.save(bet);
        }
    }

    /**
     * Get all bets for a user.
     */
    public List<BetDTO> getMyBets(Integer userId) {
        return betRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(this::toBetDTO).collect(Collectors.toList());
    }

    /**
     * Get user's bets for a specific race.
     */
    public List<BetDTO> getMyBetsForRace(Integer userId, Integer raceId) {
        return betRepository.findByRaceIdAndUserId(raceId, userId)
                .stream().map(this::toBetDTO).collect(Collectors.toList());
    }

    /**
     * Get all bets for a race (admin view).
     */
    public List<BetDTO> getBetsForRace(Integer raceId) {
        return betRepository.findByRaceId(raceId)
                .stream().map(this::toBetDTO).collect(Collectors.toList());
    }

    /**
     * Get betting stats summary for admin dashboard.
     */
    public Map<String, Object> getAdminBettingStats() {
        List<Bet> allBets = betRepository.findAll();

        BigDecimal totalBetAmount = BigDecimal.ZERO;
        BigDecimal totalPayouts = BigDecimal.ZERO;
        int totalBets = allBets.size();
        int pendingBets = 0;
        int wonBets = 0;
        int lostBets = 0;
        int refundedBets = 0;

        Map<Integer, BigDecimal> raceRevenue = new LinkedHashMap<>();

        for (Bet bet : allBets) {
            if (bet.getAmount() != null) {
                totalBetAmount = totalBetAmount.add(bet.getAmount());
            }
            if (bet.getPayout() != null) {
                totalPayouts = totalPayouts.add(bet.getPayout());
            }
            String st = bet.getStatus() != null ? bet.getStatus().toUpperCase() : "PENDING";
            switch (st) {
                case "PENDING": pendingBets++; break;
                case "WON": wonBets++; break;
                case "LOST": lostBets++; break;
                case "REFUNDED": refundedBets++; break;
                default: pendingBets++; break;
            }

            if (bet.getRaceId() != null) {
                raceRevenue.merge(bet.getRaceId(), bet.getAmount() != null ? bet.getAmount() : BigDecimal.ZERO, BigDecimal::add);
            }
        }

        BigDecimal netRevenue = totalBetAmount.subtract(totalPayouts);

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalBets", totalBets);
        stats.put("totalBetAmount", totalBetAmount);
        stats.put("totalPayouts", totalPayouts);
        stats.put("netRevenue", netRevenue);
        stats.put("pendingBets", pendingBets);
        stats.put("wonBets", wonBets);
        stats.put("lostBets", lostBets);
        stats.put("refundedBets", refundedBets);

        // Per-race breakdown
        List<Map<String, Object>> raceBreakdown = new ArrayList<>();
        for (Map.Entry<Integer, BigDecimal> entry : raceRevenue.entrySet()) {
            Integer raceId = entry.getKey();
            Race race = raceRepository.findById(raceId).orElse(null);
            BigDecimal raceBetTotal = entry.getValue();
            BigDecimal racePayoutTotal = allBets.stream()
                    .filter(b -> raceId.equals(b.getRaceId()) && b.getPayout() != null)
                    .map(Bet::getPayout)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            long raceBetCount = allBets.stream().filter(b -> raceId.equals(b.getRaceId())).count();

            Map<String, Object> raceStats = new LinkedHashMap<>();
            raceStats.put("raceId", raceId);
            raceStats.put("raceName", race != null ? (race.getClassLevel() != null ? race.getClassLevel() : "Race #" + raceId) : "Race #" + raceId);
            raceStats.put("raceStatus", race != null && race.getStatus() != null ? race.getStatus() : "UNKNOWN");
            raceStats.put("totalBets", raceBetCount);
            raceStats.put("totalBetAmount", raceBetTotal);
            raceStats.put("totalPayouts", racePayoutTotal);
            raceStats.put("profit", raceBetTotal.subtract(racePayoutTotal));
            raceBreakdown.add(raceStats);
        }
        stats.put("raceBreakdown", raceBreakdown);

        return stats;
    }

    private BetDTO toBetDTO(Bet bet) {
        BetDTO dto = new BetDTO();
        dto.setId(bet.getId());
        dto.setUserId(bet.getUserId());
        dto.setRaceId(bet.getRaceId());
        dto.setHorseId(bet.getHorseId());
        dto.setAmount(bet.getAmount());
        dto.setOdds(bet.getOdds());
        dto.setStatus(bet.getStatus());
        dto.setPayout(bet.getPayout());
        dto.setCreatedAt(bet.getCreatedAt() != null ? bet.getCreatedAt().toString() : null);
        dto.setPotentialPayout(bet.getAmount().multiply(bet.getOdds()).setScale(2, RoundingMode.HALF_UP));

        // Enrich with horse name
        Horse horse = horseRepository.findById(bet.getHorseId()).orElse(null);
        dto.setHorseName(horse != null ? horse.getName() : "Unknown");

        // Enrich with race name
        Race race = raceRepository.findById(bet.getRaceId()).orElse(null);
        dto.setRaceName(race != null ? (race.getClassLevel() != null ? race.getClassLevel() : "Race #" + race.getId()) : "Unknown");

        // Enrich with username
        User user = userRepository.findById(bet.getUserId()).orElse(null);
        dto.setUsername(user != null ? user.getUsername() : "Unknown");

        return dto;
    }
}
