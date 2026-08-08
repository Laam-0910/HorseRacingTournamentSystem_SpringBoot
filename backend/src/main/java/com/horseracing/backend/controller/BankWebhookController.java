package com.horseracing.backend.controller;

import com.horseracing.backend.entity.*;
import com.horseracing.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * BankWebhookController - Realtime Automated Bank Payment Webhook Integration
 * Supports SePay.vn, Casso.vn, and PayOS real bank transfer webhooks for Production deployment.
 * 
 * Auto-processes:
 * 1. Wallet Deposits (TOPUP_{userId}) -> Credits user wallet, logs DEPOSIT, auto-restores SUSPENDED_DEFICIT entries when balance >= 0.
 * 2. Livestream Pass Payments (PPV_{userId}_{packageType}_{meetingOrSeasonId}) -> Grants HD access, credits Admin revenue.
 */
@RestController
@RequestMapping("/api/public/wallet/webhook")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class BankWebhookController {

    private final UserRepository userRepository;
    private final WalletTransactionRepository walletTransactionRepository;
    private final RaceEntryRepository raceEntryRepository;
    private final HorseRepository horseRepository;
    private final LivestreamSubscriptionRepository subscriptionRepository;
    private final SystemConfigRepository systemConfigRepository;
    private final NotificationRepository notificationRepository;
    private final com.horseracing.backend.service.NotificationService notificationService;
    private final com.horseracing.backend.service.PayOSService payOSService;

    @Value("${sepay.webhook.secret:ANTIGRAVITY_BANK_WEBHOOK_SECRET_2026}")
    private String webhookSecret;

    @Value("${payment.bank.mode:MOCK}")
    private String paymentMode;

    /**
     * Endpoint to check current payment mode (MOCK for testing vs LIVE for production real bank webhooks).
     * Reads dynamically from SystemConfig DB table (configured by Admin in System Config UI).
     */
    @GetMapping("/mode")
    public ResponseEntity<?> getPaymentMode() {
        String currentMode = systemConfigRepository.findById("PAYMENT_GATEWAY_MODE")
                .map(SystemConfig::getConfigValue)
                .orElse(paymentMode != null ? paymentMode : "MOCK");
        String normalizedMode = currentMode != null ? currentMode.trim().toUpperCase(Locale.ROOT) : "MOCK";

        String bankName = systemConfigRepository.findById("PAYOS_BANK_NAME")
                .map(SystemConfig::getConfigValue).orElse("Vietcombank (VCB)");
        String accountNumber = systemConfigRepository.findById("PAYOS_ACCOUNT_NUMBER")
                .map(SystemConfig::getConfigValue).orElse("9999 8888 6868");
        String accountName = systemConfigRepository.findById("PAYOS_ACCOUNT_NAME")
                .map(SystemConfig::getConfigValue).orElse("HORSE RACING SYSTEM FUNDING");

        return ResponseEntity.ok(Map.of(
                "mode", normalizedMode,
                "isMock", "MOCK".equalsIgnoreCase(normalizedMode),
                "isLive", "LIVE".equalsIgnoreCase(normalizedMode),
                "bankName", bankName,
                "accountNumber", accountNumber,
                "accountName", accountName
        ));
    }

    /**
     * SePay.vn Webhook Endpoint
     * Payload format:
     * {
     *   "id": 12345,
     *   "gateway": "TPBank",
     *   "transactionDate": "2026-08-03 17:30:00",
     *   "accountNumber": "08410092005",
     *   "content": "TOPUP_15",
     *   "transferAmount": 50000,
     *   "referenceCode": "FT2600112233"
     * }
     */
    @PostMapping("/sepay")
    public ResponseEntity<?> handleSepayWebhook(
            @RequestBody Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {
        try {
            // Optional Security API key validation
            if (authHeader != null && !authHeader.isEmpty() && webhookSecret != null && !webhookSecret.isEmpty()) {
                String token = authHeader.replace("Bearer ", "").trim();
                if (!webhookSecret.equals(token)) {
                    return ResponseEntity.status(401).body(Map.of("success", false, "error", "Invalid Webhook Secret Token"));
                }
            }

            Object amountObj = payload.get("transferAmount") != null ? payload.get("transferAmount") : payload.get("amount");
            Object contentObj = payload.get("content") != null ? payload.get("content") : payload.get("description");

            if (amountObj == null || contentObj == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Missing amount or transfer content"));
            }

            BigDecimal amount = new BigDecimal(amountObj.toString().trim());
            String rawContent = contentObj.toString().trim().toUpperCase();

            // 1. Process Wallet TOPUP (Pattern: TOPUP_{userId})
            if (rawContent.contains("TOPUP_")) {
                Pattern pattern = Pattern.compile("TOPUP_(\\d+)");
                Matcher matcher = pattern.matcher(rawContent);
                if (matcher.find()) {
                    Integer userId = Integer.parseInt(matcher.group(1));
                    return processWalletDeposit(userId, amount, rawContent);
                }
            }

            // 2. Process Livestream Pass Purchase (Pattern: PPV_{userId}_{packageType}_{targetId}_{timestampRef})
            if (rawContent.contains("PPV_")) {
                String[] parts = rawContent.split("_");
                if (parts.length >= 4) {
                    Integer userId = Integer.parseInt(parts[1]);
                    String packageType = parts[2];
                    Integer targetRefId = null;
                    try { targetRefId = Integer.parseInt(parts[3]); } catch (Exception ignored) {}

                    // Idempotent check: skip if this exact transfer content was already processed
                    boolean alreadyProcessed = walletTransactionRepository.findAll().stream()
                            .anyMatch(t -> t.getDescription() != null && t.getDescription().contains(rawContent));
                    if (alreadyProcessed) {
                        return ResponseEntity.ok(Map.of("success", true, "message", "Webhook already processed (idempotent skip): " + rawContent));
                    }
                    return processLivestreamPurchase(userId, packageType, targetRefId, amount, rawContent);
                }
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "Webhook received but content did not match known patterns"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * PayOS Webhook Endpoint.
     * Configure this URL in PayOS dashboard / confirm-webhook:
     *   https://your-domain.com/api/public/wallet/webhook/payos
     *
     * PayOS sends the transfer result in data.description (e.g. TOPUP_15)
     * and signs data with PAYOS_CHECKSUM_KEY.
     */
    @PostMapping("/payos")
    public ResponseEntity<?> handlePayOSWebhook(@RequestBody Map<String, Object> payload) {
        try {
            Object successObj = payload.get("success");
            Object dataObj = payload.get("data");
            Object signatureObj = payload.get("signature");

            if (!(dataObj instanceof Map<?, ?> dataMapRaw)) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Missing PayOS data payload"));
            }

            Map<String, Object> data = new LinkedHashMap<>();
            dataMapRaw.forEach((key, value) -> data.put(String.valueOf(key), value));

            String signature = signatureObj != null ? signatureObj.toString() : "";
            if (!payOSService.isValidPaymentWebhookData(data, signature)) {
                return ResponseEntity.status(401).body(Map.of("success", false, "error", "Invalid PayOS webhook signature"));
            }

            boolean success = Boolean.TRUE.equals(successObj) || "true".equalsIgnoreCase(String.valueOf(successObj));
            String payosCode = String.valueOf(data.getOrDefault("code", ""));
            String topLevelCode = String.valueOf(payload.getOrDefault("code", ""));
            boolean paidOk = success || "00".equals(payosCode) || "00".equals(topLevelCode);
            if (!paidOk) {
                return ResponseEntity.ok(Map.of("success", true, "message", "PayOS webhook ignored because transaction is not successful"));
            }

            Object amountObj = data.get("amount");
            Object descriptionObj = data.get("description");
            Object orderCodeObj = data.get("orderCode");

            BigDecimal amount = amountObj != null ? new BigDecimal(amountObj.toString().trim()) : null;
            String description = descriptionObj != null ? descriptionObj.toString().trim().toUpperCase(Locale.ROOT) : "";
            String uniqueRef = firstNonBlank(
                    data.get("reference"),
                    data.get("paymentLinkId"),
                    data.get("orderCode")
            );
            String rawContent = (description.isBlank() ? "PAYOS" : description)
                    + (uniqueRef.isBlank() ? "" : "_REF_" + uniqueRef.toUpperCase(Locale.ROOT));

            System.out.println("[PAYOS_WEBHOOK] orderCode=" + orderCodeObj + " amount=" + amount
                    + " description=" + description + " success=" + success + " code=" + payosCode);

            if (amount == null) {
                return ResponseEntity.badRequest().body(Map.of("success", false, "error", "Missing PayOS amount"));
            }

            // 1) Prefer pending orderCode map (created when payment link was issued) — most reliable for PPV vs TOPUP
            if (orderCodeObj != null) {
                try {
                    long oc = Long.parseLong(orderCodeObj.toString());
                    Map<String, Object> pending = payOSService.peekPendingOrder(oc);
                    if (pending != null && pending.get("userId") != null) {
                        payOSService.consumePendingOrder(oc);
                        Integer userId = Integer.parseInt(pending.get("userId").toString());
                        String pendingDesc = String.valueOf(pending.getOrDefault("description", "")).toUpperCase(Locale.ROOT);
                        String purpose = String.valueOf(pending.getOrDefault("purpose", "")).toUpperCase(Locale.ROOT);
                        String fallbackContent = (pendingDesc.isBlank() ? "PAYOS" : pendingDesc) + "_REF_" + oc;
                        System.out.println("[PAYOS_WEBHOOK] Matched pending orderCode=" + oc + " purpose=" + purpose + " userId=" + userId);

                        if ("PPV".equals(purpose) || pendingDesc.contains("PPV_")) {
                            String packageType = String.valueOf(pending.getOrDefault("packageType", "SEASON"));
                            Integer targetRefId = null;
                            try {
                                if (pending.get("targetId") != null) {
                                    targetRefId = Integer.parseInt(pending.get("targetId").toString());
                                }
                            } catch (Exception ignored) {}
                            return processLivestreamPurchase(userId, packageType, targetRefId, amount, fallbackContent);
                        }
                        return processWalletDeposit(userId, amount, fallbackContent);
                    }
                } catch (Exception ex) {
                    System.err.println("[PAYOS_WEBHOOK_PENDING_ERROR] " + ex.getMessage());
                }
            }

            // 2) Parse description text from PayOS / bank
            if (description.contains("TOPUP_")) {
                Matcher matcher = Pattern.compile("TOPUP_(\\d+)").matcher(description);
                if (matcher.find()) {
                    Integer userId = Integer.parseInt(matcher.group(1));
                    return processWalletDeposit(userId, amount, rawContent);
                }
            }

            Matcher ppvMatcher = Pattern.compile("PPV_(\\d+)_([A-Z]+)_(\\d+)").matcher(description);
            if (ppvMatcher.find()) {
                Integer userId = Integer.parseInt(ppvMatcher.group(1));
                String packageType = ppvMatcher.group(2);
                Integer targetRefId = Integer.parseInt(ppvMatcher.group(3));
                return processLivestreamPurchase(userId, packageType, targetRefId, amount, rawContent);
            }

            return ResponseEntity.ok(Map.of("success", true, "message", "PayOS webhook received but description did not match known patterns", "description", description));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    /**
     * Casso.vn Webhook Endpoint (Alternative Provider)
     */
    @PostMapping("/casso")
    public ResponseEntity<?> handleCassoWebhook(@RequestBody Map<String, Object> payload) {
        try {
            List<Map<String, Object>> data = (List<Map<String, Object>>) payload.get("data");
            if (data == null || data.isEmpty()) {
                return ResponseEntity.ok(Map.of("error", 0, "message", "No transactions in payload"));
            }

            for (Map<String, Object> tx : data) {
                Object amountObj = tx.get("amount");
                Object contentObj = tx.get("description");
                if (amountObj != null && contentObj != null) {
                    BigDecimal amount = new BigDecimal(amountObj.toString().trim());
                    String rawContent = contentObj.toString().trim().toUpperCase();

                    // 1. Nạp ví: TOPUP_{userId}
                    if (rawContent.contains("TOPUP_")) {
                        Matcher matcher = Pattern.compile("TOPUP_(\\d+)").matcher(rawContent);
                        if (matcher.find()) {
                            processWalletDeposit(Integer.parseInt(matcher.group(1)), amount, rawContent);
                        }
                    }

                    // 2. Mua gói xem Livestream: PPV_{userId}_{packageType}_{targetId}_{timestamp}
                    if (rawContent.contains("PPV_")) {
                        String[] parts = rawContent.split("_");
                        if (parts.length >= 4) {
                            try {
                                Integer userId = Integer.parseInt(parts[1]);
                                String packageType = parts[2];
                                Integer targetRefId = null;
                                try { targetRefId = Integer.parseInt(parts[3]); } catch (Exception ignored) {}

                                // Idempotent: bỏ qua nếu đã xử lý
                                boolean alreadyProcessed = walletTransactionRepository.findAll().stream()
                                        .anyMatch(t -> t.getDescription() != null && t.getDescription().contains(rawContent));
                                if (!alreadyProcessed) {
                                    processLivestreamPurchase(userId, packageType, targetRefId, amount, rawContent);
                                }
                            } catch (Exception ignored) {}
                        }
                    }
                }
            }
            return ResponseEntity.ok(Map.of("error", 0, "message", "Casso Webhook processed successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", 1, "message", e.getMessage()));
        }
    }

    private ResponseEntity<?> processWalletDeposit(Integer userId, BigDecimal amount, String rawContent) {
        if (rawContent.contains("_REF_")) {
            boolean alreadyProcessed = walletTransactionRepository.findAll().stream()
                    .anyMatch(t -> t.getDescription() != null && t.getDescription().contains("(" + rawContent + ")"));
            if (alreadyProcessed) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Webhook already processed (idempotent skip): " + rawContent));
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));

        BigDecimal current = user.getWalletBalance() != null ? user.getWalletBalance() : BigDecimal.ZERO;
        user.setWalletBalance(current.add(amount));
        user.setBalance(current.add(amount));
        userRepository.save(user);

        WalletTransaction tx = new WalletTransaction();
        tx.setUserId(user.getId());
        tx.setAmount(amount);
        tx.setTransactionType("DEPOSIT");
        tx.setDescription(String.format("Wallet top-up via bank transfer | Amount: +%,.0f VND credited to your wallet", amount.doubleValue()));
        tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
        walletTransactionRepository.save(tx);

        try {
            Notification notif = new Notification();
            notif.setUserId(user.getId());
            notif.setTitle("💰 Bank Webhook Deposit Received!");
            notif.setMessage(String.format("Realtime bank transfer of %,.0f VNĐ received and credited to your wallet balance.", amount));
            notif.setIsRead(false);
            notif.setCreatedAt(new Timestamp(System.currentTimeMillis()));
            notificationRepository.save(notif);

            notificationService.notifyAllAdmins("💳 Realtime Bank Deposit Received", 
                String.format("User %s (ID: #%d) completed a bank transfer of %,.0f VNĐ via webhook.", user.getUsername(), user.getId(), amount));
        } catch (Exception ex) {
            System.err.println("[WEBHOOK_NOTIF_ERROR] Failed to save deposit notification: " + ex.getMessage());
        }

        // Auto-reactivate any SUSPENDED_DEFICIT entries if wallet balance is restored to >= 0
        if (user.getWalletBalance().compareTo(BigDecimal.ZERO) >= 0) {
            if (user.getRoleId() != null && user.getRoleId() == 2) { // Owner
                List<Horse> ownerHorses = horseRepository.findByOwnerId(user.getId());
                List<Integer> hIds = ownerHorses.stream().map(Horse::getId).collect(Collectors.toList());
                if (!hIds.isEmpty()) {
                    List<RaceEntry> suspended = raceEntryRepository.findAll().stream()
                            .filter(e -> hIds.contains(e.getHorseId()) && "SUSPENDED_DEFICIT".equalsIgnoreCase(e.getStatus()))
                            .collect(Collectors.toList());
                    for (RaceEntry e : suspended) {
                        e.setStatus("APPROVED");
                        raceEntryRepository.save(e);
                    }
                }
            } else { // Jockey
                List<RaceEntry> suspended = raceEntryRepository.findByJockeyId(user.getId()).stream()
                        .filter(e -> "SUSPENDED_DEFICIT".equalsIgnoreCase(e.getStatus()))
                        .collect(Collectors.toList());
                for (RaceEntry e : suspended) {
                    e.setStatus("APPROVED");
                    raceEntryRepository.save(e);
                }
            }
        }

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Deposit processed via Webhook",
                "userId", userId,
                "amount", amount,
                "newBalance", user.getWalletBalance()
        ));
    }

    private String firstNonBlank(Object... values) {
        for (Object value : values) {
            if (value != null && !value.toString().trim().isBlank()) {
                return value.toString().trim();
            }
        }
        return "";
    }

    private ResponseEntity<?> processLivestreamPurchase(Integer userId, String packageType, Integer refId, BigDecimal amount, String rawContent) {
        if (rawContent.contains("_REF_")) {
            boolean alreadyProcessed = walletTransactionRepository.findAll().stream()
                    .anyMatch(t -> t.getDescription() != null && t.getDescription().contains("(" + rawContent + ")"));
            if (alreadyProcessed) {
                return ResponseEntity.ok(Map.of("success", true, "message", "Webhook already processed (idempotent skip): " + rawContent));
            }
        }

        long now = System.currentTimeMillis();
        List<LivestreamSubscription> existingSubs = subscriptionRepository.findByUserId(userId);
        
        boolean hasActiveSeason = existingSubs.stream().anyMatch(s -> 
            "SEASON".equalsIgnoreCase(s.getPackageType()) && s.getExpiresAt() != null && s.getExpiresAt().getTime() > now
        );

        long baseExpiryTime = existingSubs.stream()
                .filter(s -> s.getExpiresAt() != null && s.getExpiresAt().getTime() > now)
                .mapToLong(s -> s.getExpiresAt().getTime())
                .max()
                .orElse(now);

        long durationMillis = "SEASON".equalsIgnoreCase(packageType)
                ? 365L * 24 * 3600 * 1000L
                : 30L * 24 * 3600 * 1000L;

        String finalPackageType = (hasActiveSeason || "SEASON".equalsIgnoreCase(packageType)) ? "SEASON" : packageType.toUpperCase();

        LivestreamSubscription sub = new LivestreamSubscription();
        sub.setUserId(userId);
        sub.setPackageType(finalPackageType);
        if ("SEASON".equalsIgnoreCase(finalPackageType)) {
            sub.setSeasonId(refId);
        } else {
            sub.setRaceMeetingId(refId);
        }
        sub.setPricePaid(amount);
        sub.setPurchaseTime(new Timestamp(now));
        sub.setExpiresAt(new Timestamp(baseExpiryTime + durationMillis));
        sub.setPaymentMethod("VIETQR_BANK_WEBHOOK");
        subscriptionRepository.save(sub);

        // Credit Admin wallet revenue
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
                    String passLabelWebhook = "SEASON".equalsIgnoreCase(packageType) ? "Annual Pass (365-day access)" : "Monthly Pass (30-day access)";
                    tx.setDescription("Livestream revenue received via VietQR bank transfer | " + passLabelWebhook + " | Amount: " + String.format("%,.0f", amount) + " VND");
                    if (refId != null && "RACEMEETING".equalsIgnoreCase(packageType)) tx.setRaceMeetingId(refId);
                    tx.setCreatedAt(new Timestamp(System.currentTimeMillis()));
                    walletTransactionRepository.save(tx);
                });

        return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Livestream Subscription activated via Webhook",
                "userId", userId,
                "subscription", sub
        ));
    }
}
