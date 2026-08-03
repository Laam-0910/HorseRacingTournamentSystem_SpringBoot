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
            @RequestParam(required = false) Integer seasonId) {
        
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
                return seasonId == null || seasonId.equals(sub.getSeasonId());
            }
            if ("RACEMEETING".equalsIgnoreCase(sub.getPackageType())) {
                return meetingId == null || meetingId.equals(sub.getRaceMeetingId());
            }
            return false;
        });

        Optional<LivestreamSubscription> activeSub = userSubs.stream().filter(sub -> {
            if (sub.getExpiresAt() != null && sub.getExpiresAt().before(now)) return false;
            return true;
        }).findFirst();

        Map<String, Object> resp = new java.util.HashMap<>();
        resp.put("hasAccess", hasAccess);
        resp.put("packageType", activeSub.map(LivestreamSubscription::getPackageType).orElse(null));
        resp.put("expiresAt", activeSub.map(s -> s.getExpiresAt() != null ? s.getExpiresAt().toString() : "").orElse(""));
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
            @RequestParam(required = false) Integer raceMeetingId) {

        List<LivestreamSubscription> userSubs = subscriptionRepository.findByUserId(userId);

        if ("RACEMEETING".equalsIgnoreCase(packageType)) {
            return ResponseEntity.ok(Map.of(
                    "packageType", "RACEMEETING",
                    "originalPrice", BASE_MEETING_PRICE,
                    "finalPrice", BASE_MEETING_PRICE,
                    "discountApplied", BigDecimal.ZERO,
                    "description", "Pay-Per-View Pass for 1 Race Meeting (15,000 VNĐ)"
            ));
        }

        if ("SEASON".equalsIgnoreCase(packageType)) {
            // Calculate total paid for meeting passes in this season
            BigDecimal paidForMeetings = userSubs.stream()
                    .filter(s -> "RACEMEETING".equalsIgnoreCase(s.getPackageType()) &&
                            (seasonId == null || seasonId.equals(s.getSeasonId())))
                    .map(LivestreamSubscription::getPricePaid)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            // Check if user owned a season pass for a previous season (loyalty discount 15%)
            boolean isRenewal = userSubs.stream()
                    .anyMatch(s -> "SEASON".equalsIgnoreCase(s.getPackageType()) &&
                            (seasonId == null || !seasonId.equals(s.getSeasonId())));

            BigDecimal finalPrice = BASE_SEASON_PRICE;
            BigDecimal discountApplied = BigDecimal.ZERO;
            String note = "Full Season Pass (79,000 VNĐ)";

            if (paidForMeetings.compareTo(BigDecimal.ZERO) > 0) {
                // Prorated upgrade: subtract paid meeting passes
                discountApplied = paidForMeetings;
                finalPrice = BASE_SEASON_PRICE.subtract(paidForMeetings);
                if (finalPrice.compareTo(new BigDecimal("10000")) < 0) {
                    finalPrice = new BigDecimal("10000"); // minimum 10,000 VNĐ
                }
                note = "Prorated Upgrade to Season Pass (Credit applied: " + String.format("%,.0f", paidForMeetings) + " VNĐ)";
            } else if (isRenewal) {
                // Loyalty 15% discount
                discountApplied = BASE_SEASON_PRICE.multiply(new BigDecimal("0.15")).setScale(0, RoundingMode.HALF_UP);
                finalPrice = BASE_SEASON_PRICE.subtract(discountApplied);
                note = "Loyalty Renewal 15% Discount Applied";
            }

            return ResponseEntity.ok(Map.of(
                    "packageType", "SEASON",
                    "originalPrice", BASE_SEASON_PRICE,
                    "finalPrice", finalPrice,
                    "discountApplied", discountApplied,
                    "description", note
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
                    return ResponseEntity.badRequest().body(Map.of("success", false, "error", String.format("Insufficient wallet balance ($%,.2f available, $%,.2f required). Please top up your wallet via VietQR.", bal, amount)));
                }
                spectator.setWalletBalance(bal.subtract(amount));
                spectator.setBalance(bal.subtract(amount));
                userRepository.save(spectator);

                WalletTransaction txUser = new WalletTransaction();
                txUser.setUserId(spectator.getId());
                txUser.setAmount(amount.negate());
                txUser.setTransactionType("LIVESTREAM_TICKET_PAYMENT");
                txUser.setDescription("HD Livestream " + packageType.toUpperCase() + " Pass payment");
                if (raceMeetingId != null) txUser.setRaceMeetingId(raceMeetingId);
                txUser.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                walletTransactionRepository.save(txUser);
            }

            LivestreamSubscription sub = new LivestreamSubscription();
            sub.setUserId(userId);
            sub.setPackageType(packageType.toUpperCase());
            sub.setSeasonId(seasonId);
            sub.setRaceMeetingId(raceMeetingId);
            sub.setPricePaid(amount);
            sub.setPurchaseTime(new Timestamp(System.currentTimeMillis()));

            // Season passes expire in 1 year (365 days), Meeting passes expire in 3 days
            long expiryMillis = "SEASON".equalsIgnoreCase(packageType)
                    ? System.currentTimeMillis() + 365L * 24 * 3600 * 1000
            : System.currentTimeMillis() + 3L * 24 * 3600 * 1000;
            sub.setExpiresAt(new Timestamp(expiryMillis));
            sub.setPaymentMethod(payMethod);

            subscriptionRepository.save(sub);

            // Gửi thông báo đến Spectator đã đăng ký mua thẻ xem live thành công
            notificationService.notifySpectatorOnTicketPurchase(userId, packageType, amount);

            // Log purchase transaction for Spectator user
            WalletTransaction userTx = new WalletTransaction();
            userTx.setUserId(userId);
            userTx.setAmount(amount);
            userTx.setTransactionType("LIVESTREAM_PPV_PURCHASE");
            userTx.setDescription("Unlocked Livestream HD Access (" + packageType.toUpperCase() + " Pass via VietQR)");
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
                        tx.setDescription("Livestream PPV subscription revenue from User #" + userId + " (" + packageType.toUpperCase() + ")");
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
