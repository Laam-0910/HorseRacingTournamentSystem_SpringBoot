package com.horseracing.backend.controller;

import com.horseracing.backend.entity.LivestreamSubscription;
import com.horseracing.backend.entity.User;
import com.horseracing.backend.entity.WalletTransaction;
import com.horseracing.backend.repository.LivestreamSubscriptionRepository;
import com.horseracing.backend.repository.UserRepository;
import com.horseracing.backend.repository.WalletTransactionRepository;
import com.horseracing.backend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/public/livestream")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class LivestreamSubscriptionController {

    private final LivestreamSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final NotificationService notificationService;

    private static final BigDecimal BASE_MEETING_PRICE = new BigDecimal("15000");
    private static final BigDecimal BASE_SEASON_PRICE = new BigDecimal("79000");

    /**
     * Check if a spectator has active access to watch a livestream for a given meeting/season
     */
    @GetMapping("/access")
    public ResponseEntity<?> checkAccess(
            @RequestParam(required = false) Integer userId,
            @RequestParam(required = false) Integer meetingId,
            @RequestParam(required = false) Integer raceMeetingId,
            @RequestParam(required = false) Integer seasonId) {
        
        final Integer targetMeetingId = (meetingId != null) ? meetingId : raceMeetingId;

        if (userId == null) {
            return ResponseEntity.ok(Map.of("hasAccess", false, "reason", "UNAUTHENTICATED"));
        }

        List<LivestreamSubscription> userSubs = subscriptionRepository.findByUserId(userId);
        Timestamp now = new Timestamp(System.currentTimeMillis());

        boolean hasAccess = userSubs.stream().anyMatch(sub -> {
            if (sub.getExpiresAt() != null && sub.getExpiresAt().before(now)) {
                return false;
            }
            if ("SEASON".equalsIgnoreCase(sub.getPackageType())) {
                return seasonId == null || sub.getSeasonId() == null || seasonId.equals(sub.getSeasonId());
            }
            if ("RACEMEETING".equalsIgnoreCase(sub.getPackageType())) {
                return targetMeetingId != null && targetMeetingId.equals(sub.getRaceMeetingId());
            }
            return false;
        });

        // Prefer active subscription expiring latest to correctly expose accumulated extension date
        boolean hasActiveSeason = userSubs.stream().anyMatch(sub ->
                "SEASON".equalsIgnoreCase(sub.getPackageType()) && (sub.getExpiresAt() == null || !sub.getExpiresAt().before(now))
        );

        Optional<LivestreamSubscription> activeSub = userSubs.stream()
                .filter(sub -> sub.getExpiresAt() == null || !sub.getExpiresAt().before(now))
                .sorted((a, b) -> {
                    long expA = a.getExpiresAt() != null ? a.getExpiresAt().getTime() : Long.MAX_VALUE;
                    long expB = b.getExpiresAt() != null ? b.getExpiresAt().getTime() : Long.MAX_VALUE;
                    return Long.compare(expB, expA);
                })
                .findFirst();

        String effectivePackageType = hasActiveSeason ? "SEASON" : activeSub.map(LivestreamSubscription::getPackageType).orElse(null);

        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("hasAccess", hasAccess);
        resp.put("packageType", effectivePackageType);
        resp.put("expiresAt", activeSub.map(s -> s.getExpiresAt() != null ? s.getExpiresAt().getTime() : 0L).orElse(0L));
        resp.put("expiresAtFormatted", activeSub.map(s -> s.getExpiresAt() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(s.getExpiresAt()) : "").orElse(""));
        resp.put("startDateFormatted", activeSub.map(s -> s.getPurchaseTime() != null ? new java.text.SimpleDateFormat("yyyy-MM-dd HH:mm").format(s.getPurchaseTime()) : "").orElse(""));
        return ResponseEntity.ok(resp);
    }

    /**
     * Get dynamic pricing quote for a user (calculates prorated upgrades or renewal discounts)
     */
    @GetMapping("/quote")
    public ResponseEntity<?> getQuote(
            @RequestParam Integer userId,
            @RequestParam String packageType,
            @RequestParam(required = false) Integer seasonId,
            @RequestParam(required = false) Integer raceMeetingId,
            @RequestParam(required = false) Boolean isExtend) {

        List<LivestreamSubscription> userSubs = subscriptionRepository.findByUserId(userId);

        if ("RACEMEETING".equalsIgnoreCase(packageType)) {
            return ResponseEntity.ok(Map.of(
                    "packageType", "RACEMEETING",
                    "originalPrice", BASE_MEETING_PRICE,
                    "finalPrice", BASE_MEETING_PRICE,
                    "discountApplied", BigDecimal.ZERO,
                    "description", "Extend Monthly Pass (+30 Days for 15,000 VNĐ)"
            ));
        }

        if ("SEASON".equalsIgnoreCase(packageType)) {
            // Keep fixed price (79,000 VNĐ) without prorated discounts so upgrading costs 79k and accumulates days
            return ResponseEntity.ok(Map.of(
                    "packageType", "SEASON",
                    "originalPrice", BASE_SEASON_PRICE,
                    "finalPrice", BASE_SEASON_PRICE,
                    "discountApplied", BigDecimal.ZERO,
                    "description", "Annual Pass (79,000 VNĐ - 365 Days)"
            ));
        }

        return ResponseEntity.badRequest().body(Map.of("error", "Invalid package type"));
    }

    /**
     * Purchase / Activate a livestream subscription package via VietQR or Wallet balance
     */
    @PostMapping("/purchase")
    public ResponseEntity<?> purchaseSubscription(@RequestBody Map<String, Object> body) {
        try {
            Integer userId = Integer.parseInt(body.get("userId").toString());
            String packageType = body.get("packageType").toString();
            Integer seasonId = body.get("seasonId") != null ? Integer.parseInt(body.get("seasonId").toString()) : null;
            Integer raceMeetingId = body.get("raceMeetingId") != null ? Integer.parseInt(body.get("raceMeetingId").toString()) : null;
            BigDecimal amount = new BigDecimal(body.get("amount").toString());
            String payMethod = body.get("paymentMethod") != null ? body.get("paymentMethod").toString() : "VIETQR";

            User spectator = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

            // If paying via wallet, verify sufficient balance & deduct
            if ("WALLET".equalsIgnoreCase(payMethod)) {
                BigDecimal bal = spectator.getWalletBalance() != null ? spectator.getWalletBalance() : BigDecimal.ZERO;
                if (bal.compareTo(amount) < 0) {
                    return ResponseEntity.badRequest().body(Map.of("success", false, "error", String.format("Insufficient wallet balance (%,.2f VNĐ available, %,.2f VNĐ required). Please top up your wallet via VietQR.", bal, amount)));
                }
                spectator.setWalletBalance(bal.subtract(amount));
                spectator.setBalance(bal.subtract(amount));
                userRepository.save(spectator);

                WalletTransaction txUser = new WalletTransaction();
                txUser.setUserId(spectator.getId());
                txUser.setAmount(amount.negate());
                txUser.setTransactionType("LIVESTREAM_TICKET_PAYMENT");
                String passLabel = "SEASON".equalsIgnoreCase(packageType) ? "Annual Pass (365-day access)" : "Monthly Pass (30-day access)";
                txUser.setDescription("HD Livestream " + passLabel + " purchased | Amount: " + String.format("%,.0f", amount) + " VND");
                if (raceMeetingId != null) txUser.setRaceMeetingId(raceMeetingId);
                txUser.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                walletTransactionRepository.save(txUser);
            }

            long now = System.currentTimeMillis();
            List<LivestreamSubscription> existingSubs = subscriptionRepository.findByUserId(userId);

            // Check if user currently has an active SEASON (Annual Pass) subscription
            boolean hasActiveSeason = existingSubs.stream().anyMatch(s ->
                    "SEASON".equalsIgnoreCase(s.getPackageType()) && s.getExpiresAt() != null && s.getExpiresAt().getTime() > now
            );

            // Cumulative Extension & Upgrade Stacking Logic:
            // Find max existing expiresAt across ALL active subscriptions of the user
            long baseExpiryTime = existingSubs.stream()
                    .filter(s -> s.getExpiresAt() != null && s.getExpiresAt().getTime() > now)
                    .mapToLong(s -> s.getExpiresAt().getTime())
                    .max()
                    .orElse(now);

            // Monthly Pass (RACEMEETING) = 30 days; Annual Pass (SEASON) = 365 days
            long durationMillis = "SEASON".equalsIgnoreCase(packageType)
                    ? 365L * 24 * 3600 * 1000L
                    : 30L * 24 * 3600 * 1000L;

            // If user has an active SEASON pass, any extension (+30 days or +365 days) preserves packageType as SEASON
            String finalPackageType = (hasActiveSeason || "SEASON".equalsIgnoreCase(packageType)) ? "SEASON" : packageType.toUpperCase();

            LivestreamSubscription sub = new LivestreamSubscription();
            sub.setUserId(userId);
            sub.setPackageType(finalPackageType);
            sub.setSeasonId(seasonId);
            sub.setRaceMeetingId(raceMeetingId);
            sub.setPricePaid(amount);
            sub.setPurchaseTime(new Timestamp(now));
            sub.setExpiresAt(new Timestamp(baseExpiryTime + durationMillis));
            sub.setPaymentMethod(payMethod);

            subscriptionRepository.save(sub);

            // Gửi thông báo đến Spectator đã đăng ký mua thẻ xem live thành công
            notificationService.notifySpectatorOnTicketPurchase(userId, packageType, amount);

            // Log purchase transaction for Spectator user (negative amount for expense)
            WalletTransaction userTx = new WalletTransaction();
            userTx.setUserId(userId);
            userTx.setAmount(amount.negate());
            userTx.setTransactionType("LIVESTREAM_PPV_PURCHASE");
            String passLabel2 = "SEASON".equalsIgnoreCase(packageType) ? "Annual Pass (365-day access)" : "Monthly Pass (30-day access)";
            userTx.setDescription("HD Livestream " + passLabel2 + " activated via VietQR bank transfer | Amount: " + String.format("%,.0f", amount) + " VND");
            if (raceMeetingId != null) userTx.setRaceMeetingId(raceMeetingId);
            userTx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
            walletTransactionRepository.save(userTx);

            // Print explicit server system log
            System.out.println("[LIVESTREAM_PURCHASE_LOG] User #" + userId + " successfully unlocked " + packageType.toUpperCase() + " pass for " + amount + " VND via VietQR.");

            // Increment Admin wallet balance & log revenue transaction
            userRepository.findAll().stream()
                    .filter(u -> u.getRoleId() != null && u.getRoleId() == 1)
                    .findFirst()
                    .ifPresent(admin -> {
                        BigDecimal curBal = admin.getWalletBalance() != null ? admin.getWalletBalance() : BigDecimal.ZERO;
                        admin.setWalletBalance(curBal.add(amount));
                        userRepository.save(admin);

                        WalletTransaction tx = new WalletTransaction();
                        tx.setUserId(admin.getId());
                        tx.setAmount(amount);
                        tx.setTransactionType("LIVESTREAM_REVENUE");
                        String passLabelAdmin = "SEASON".equalsIgnoreCase(packageType) ? "Annual Pass" : "Monthly Pass";
                        tx.setDescription("Livestream revenue received from User #" + userId + " | " + passLabelAdmin + " | Amount: " + String.format("%,.0f", amount) + " VND");
                        if (raceMeetingId != null) tx.setRaceMeetingId(raceMeetingId);
                        tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                        walletTransactionRepository.save(tx);
                    });

            return ResponseEntity.ok(Map.of("success", true, "subscription", sub, "newWalletBalance", spectator.getWalletBalance()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }
}
