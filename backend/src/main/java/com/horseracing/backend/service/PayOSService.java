package com.horseracing.backend.service;

import com.horseracing.backend.entity.SystemConfig;
import com.horseracing.backend.repository.SystemConfigRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Service PayOSService - Official PayOS Payment Gateway REST API Integration.
 * Automatically generates live PayOS Payment Links and VietQR payment data directly from PayOS API
 * using Client ID, API Key, and Checksum Key configured by Admin.
 */
@Service
public class PayOSService {

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    private final RestTemplate restTemplate = new RestTemplate();

    /** In-memory pending PayOS orders: orderCode -> {userId, amount, description, createdAt} */
    private final Map<Long, Map<String, Object>> pendingOrders = new ConcurrentHashMap<>();

    public String getConfigValue(String key) {
        return systemConfigRepository.findById(key)
                .map(SystemConfig::getConfigValue)
                .orElse("");
    }

    public void rememberPendingOrder(long orderCode, int userId, int amount, String description) {
        rememberPendingOrder(orderCode, userId, amount, description, null);
    }

    public void rememberPendingOrder(long orderCode, int userId, int amount, String description, Map<String, Object> extra) {
        Map<String, Object> info = new HashMap<>();
        info.put("userId", userId);
        info.put("amount", amount);
        info.put("description", description != null ? description : "");
        info.put("createdAt", System.currentTimeMillis());
        if (extra != null) {
            info.putAll(extra);
        }
        pendingOrders.put(orderCode, info);
    }

    public Map<String, Object> consumePendingOrder(long orderCode) {
        return pendingOrders.remove(orderCode);
    }

    public Map<String, Object> peekPendingOrder(long orderCode) {
        return pendingOrders.get(orderCode);
    }

    /**
     * Call PayOS REST API POST https://api-merchant.payos.vn/v2/payment-requests
     * Returns live PayOS checkoutUrl, qrCode, accountNumber, accountName, bin.
     */
    @SuppressWarnings("unchecked")
    public Map<String, Object> createPaymentLink(long orderCode, int amount, String description, String cancelUrl, String returnUrl) {
        String clientId = getConfigValue("PAYOS_CLIENT_ID").trim();
        String apiKey = getConfigValue("PAYOS_API_KEY").trim();
        String checksumKey = getConfigValue("PAYOS_CHECKSUM_KEY").trim();

        if (clientId.isBlank() || apiKey.isBlank() || checksumKey.isBlank() 
                || "NOT_SET".equalsIgnoreCase(clientId) || "NOT_SET".equalsIgnoreCase(apiKey)) {
            return Map.of("success", false, "error", "PayOS API Keys (Client ID, API Key, Checksum Key) are NOT configured in System Config.");
        }

        try {
            // PayOS signature string: amount={amount}&cancelUrl={cancelUrl}&description={description}&orderCode={orderCode}&returnUrl={returnUrl}
            String rawSignature = String.format("amount=%d&cancelUrl=%s&description=%s&orderCode=%d&returnUrl=%s",
                    amount, cancelUrl, description, orderCode, returnUrl);

            String signature = hmacSha256(rawSignature, checksumKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("orderCode", orderCode);
            requestBody.put("amount", amount);
            requestBody.put("description", description);
            requestBody.put("cancelUrl", cancelUrl);
            requestBody.put("returnUrl", returnUrl);
            requestBody.put("signature", signature);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-client-id", clientId);
            headers.set("x-api-key", apiKey);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                    "https://api-merchant.payos.vn/v2/payment-requests",
                    HttpMethod.POST,
                    entity,
                    Map.class
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> respMap = (Map<String, Object>) response.getBody();
                String code = String.valueOf(respMap.get("code"));
                if ("00".equals(code) && respMap.get("data") != null) {
                    Map<String, Object> data = new HashMap<>((Map<String, Object>) respMap.get("data"));
                    data.put("success", true);
                    // Track order so webhook can credit even if bank description is altered
                    try {
                        Object oc = data.get("orderCode");
                        if (oc != null) {
                            // userId is embedded in description TOPUP_{id} when created that way
                            Matcher m = Pattern.compile("TOPUP_(\\d+)", Pattern.CASE_INSENSITIVE).matcher(description);
                            if (m.find()) {
                                rememberPendingOrder(Long.parseLong(oc.toString()), Integer.parseInt(m.group(1)), amount, description);
                            }
                        }
                    } catch (Exception ignored) {}
                    return data;
                } else {
                    String desc = String.valueOf(respMap.get("desc"));
                    return Map.of("success", false, "error", "PayOS Error (" + code + "): " + desc);
                }
            } else {
                return Map.of("success", false, "error", "Failed to connect to PayOS API (HTTP " + response.getStatusCode() + ")");
            }
        } catch (org.springframework.web.client.HttpStatusCodeException ex) {
            String body = ex.getResponseBodyAsString();
            System.err.println("[PAYOS_HTTP_ERROR] " + ex.getStatusCode() + " - " + body);
            return Map.of("success", false, "error", "PayOS HTTP " + ex.getStatusCode().value() + ": " + (body.isBlank() ? ex.getMessage() : body));
        } catch (Exception ex) {
            System.err.println("[PAYOS_CREATE_LINK_ERROR] " + ex.getMessage());
            return Map.of("success", false, "error", "PayOS API Error: " + ex.getMessage());
        }
    }

    public boolean isValidPaymentWebhookData(Map<String, Object> data, String signature) {
        if (data == null || signature == null || signature.isBlank()) {
            return false;
        }

        String checksumKey = getConfigValue("PAYOS_CHECKSUM_KEY").trim();
        if (checksumKey.isBlank() || "NOT_SET".equalsIgnoreCase(checksumKey)) {
            return false;
        }

        try {
            String dataToSign = toSortedQueryString(data);
            String expectedSignature = hmacSha256(dataToSign, checksumKey);
            return expectedSignature.equalsIgnoreCase(signature.trim());
        } catch (Exception ex) {
            System.err.println("[PAYOS_WEBHOOK_SIGNATURE_ERROR] " + ex.getMessage());
            return false;
        }
    }

    private String toSortedQueryString(Map<String, Object> data) {
        TreeMap<String, Object> sorted = new TreeMap<>(data);
        List<String> pairs = new ArrayList<>();
        for (Map.Entry<String, Object> entry : sorted.entrySet()) {
            Object value = entry.getValue();
            String valueAsString = "";
            if (value != null && !"undefined".equals(value) && !"null".equals(value)) {
                valueAsString = String.valueOf(value);
            }
            pairs.add(entry.getKey() + "=" + valueAsString);
        }
        return String.join("&", pairs);
    }

    private String hmacSha256(String data, String key) throws Exception {
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] hash = sha256_HMAC.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder result = new StringBuilder();
        for (byte b : hash) {
            result.append(String.format("%02x", b));
        }
        return result.toString();
    }
}
