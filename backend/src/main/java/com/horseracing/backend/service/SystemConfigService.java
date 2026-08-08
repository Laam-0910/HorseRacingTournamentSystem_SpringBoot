package com.horseracing.backend.service;

import com.horseracing.backend.dto.SystemConfigDTO;
import com.horseracing.backend.entity.SystemConfig;
import com.horseracing.backend.mapper.SystemConfigMapper;
import com.horseracing.backend.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Lớp dịch vụ SystemConfigService - Quản lý tham số cấu hình hệ thống.
 * - Cung cấp danh sách các tham số cấu hình dạng DTO cho máy khách.
 * - Thực hiện cập nhật hàng loạt các tham số cấu hình hệ thống dưới dạng giao dịch an toàn (Transactional).
 */
@Service
@RequiredArgsConstructor
public class SystemConfigService {

    private final SystemConfigRepository systemConfigRepository; // Kho lưu trữ cấu hình hệ thống
    private final SystemConfigMapper systemConfigMapper; // Bộ ánh xạ cấu hình thực thể sang DTO

    // Lấy danh sách toàn bộ các cấu hình hệ thống dưới dạng DTO (tự động bổ sung các phím cấu hình mặc định còn thiếu)
    public List<SystemConfigDTO> getAllConfigs() {
        ensureDefaultConfigsExist();
        return systemConfigRepository.findAll().stream()
                .map(systemConfigMapper::toDTO)
                .collect(Collectors.toList());
    }

    private void ensureDefaultConfigsExist() {
        Map<String, String> defaultMap = Map.ofEntries(
            Map.entry("PAYMENT_GATEWAY_MODE", "MOCK"),
            Map.entry("AUTO_DISBURSEMENT_ENABLED", "TRUE"),
            Map.entry("MIN_WITHDRAWAL_AMOUNT", "50000"),
            Map.entry("DEFAULT_JOCKEY_HIRE_FEE", "500000.00"),
            Map.entry("MIN_TICKET_PRICE", "10000.00"),
            Map.entry("MAX_TICKET_PRICE", "5000000.00"),
            Map.entry("PRIZE_SHARE_1ST", "50.00"),
            Map.entry("PRIZE_SHARE_2ND", "30.00"),
            Map.entry("PRIZE_SHARE_3RD", "20.00"),
            Map.entry("PAYOS_CLIENT_ID", ""),
            Map.entry("PAYOS_API_KEY", ""),
            Map.entry("PAYOS_CHECKSUM_KEY", ""),
            Map.entry("PAYOS_PAYOUT_API_KEY", ""),
            Map.entry("PAYOS_BANK_NAME", "MBBank (MB)"),
            Map.entry("PAYOS_ACCOUNT_NUMBER", ""),
            Map.entry("PAYOS_ACCOUNT_NAME", "")
        );

        for (Map.Entry<String, String> e : defaultMap.entrySet()) {
            if (!systemConfigRepository.existsById(e.getKey())) {
                SystemConfig cfg = new SystemConfig();
                cfg.setConfigKey(e.getKey());
                cfg.setConfigValue(e.getValue());
                cfg.setDescription("System parameter: " + e.getKey());
                cfg.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
                systemConfigRepository.save(cfg);
            }
        }
    }

    // Cập nhật giá trị các tham số cấu hình hệ thống
    @Transactional
    public void updateConfigs(Map<String, String> configs) {
        // Prepare validation values for Prize Share 1st, 2nd, 3rd if updated
        java.math.BigDecimal p1 = null, p2 = null, p3 = null;

        // Fetch current values as fallbacks
        try {
            String p1Str = configs.getOrDefault("PRIZE_SHARE_1ST", systemConfigRepository.findById("PRIZE_SHARE_1ST").map(SystemConfig::getConfigValue).orElse("50.00"));
            String p2Str = configs.getOrDefault("PRIZE_SHARE_2ND", systemConfigRepository.findById("PRIZE_SHARE_2ND").map(SystemConfig::getConfigValue).orElse("30.00"));
            String p3Str = configs.getOrDefault("PRIZE_SHARE_3RD", systemConfigRepository.findById("PRIZE_SHARE_3RD").map(SystemConfig::getConfigValue).orElse("20.00"));
            p1 = new java.math.BigDecimal(p1Str);
            p2 = new java.math.BigDecimal(p2Str);
            p3 = new java.math.BigDecimal(p3Str);
        } catch (Exception ignored) {}

        if (configs.containsKey("PRIZE_SHARE_1ST") || configs.containsKey("PRIZE_SHARE_2ND") || configs.containsKey("PRIZE_SHARE_3RD")) {
            if (p1 == null || p2 == null || p3 == null) {
                throw new IllegalArgumentException("Invalid numeric format for prize share percentages.");
            }
            if (p1.compareTo(new java.math.BigDecimal("40.00")) < 0 || p1.compareTo(new java.math.BigDecimal("80.00")) > 0) {
                throw new IllegalArgumentException("1st Place Prize Share must be between 40% and 80%.");
            }
            if (p1.compareTo(p2) <= 0) {
                throw new IllegalArgumentException("Invalid Prize Hierarchy: 1st Place Share (" + p1 + "%) must be strictly greater than 2nd Place Share (" + p2 + "%).");
            }
            if (p2.compareTo(p3) <= 0) {
                throw new IllegalArgumentException("Invalid Prize Hierarchy: 2nd Place Share (" + p2 + "%) must be strictly greater than 3rd Place Share (" + p3 + "%).");
            }
            if (p3.compareTo(java.math.BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("3rd Place Share cannot be negative.");
            }
            java.math.BigDecimal totalShare = p1.add(p2).add(p3);
            if (totalShare.compareTo(new java.math.BigDecimal("100.00")) != 0) {
                throw new IllegalArgumentException("Prize Distribution Error: Total sum of 1st, 2nd, and 3rd place shares must equal exactly 100.00% (Current sum: " + totalShare + "%).");
            }
        }

        // Validate ticket price min/max bounds if being updated
        if (configs.containsKey("MIN_TICKET_PRICE") || configs.containsKey("MAX_TICKET_PRICE")) {
            try {
                String minStr = configs.getOrDefault("MIN_TICKET_PRICE", systemConfigRepository.findById("MIN_TICKET_PRICE").map(SystemConfig::getConfigValue).orElse("10000.00"));
                String maxStr = configs.getOrDefault("MAX_TICKET_PRICE", systemConfigRepository.findById("MAX_TICKET_PRICE").map(SystemConfig::getConfigValue).orElse("5000000.00"));
                java.math.BigDecimal minPrice = new java.math.BigDecimal(minStr);
                java.math.BigDecimal maxPrice = new java.math.BigDecimal(maxStr);
                if (minPrice.compareTo(java.math.BigDecimal.ZERO) < 0) {
                    throw new IllegalArgumentException("Minimum ticket price cannot be negative.");
                }
                if (maxPrice.compareTo(minPrice) <= 0) {
                    throw new IllegalArgumentException("Maximum ticket price must be strictly greater than Minimum ticket price.");
                }
            } catch (NumberFormatException e) {
                throw new IllegalArgumentException("Invalid numeric format for ticket price configuration.");
            }
        }

        // Duyệt qua từng khóa-giá trị cấu hình nhận được từ client
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            if ("DEFAULT_JOCKEY_HIRE_FEE".equalsIgnoreCase(entry.getKey())) {
                try {
                    java.math.BigDecimal val = new java.math.BigDecimal(entry.getValue());
                    java.math.BigDecimal minFee = new java.math.BigDecimal("10000.00");
                    java.math.BigDecimal maxFee = new java.math.BigDecimal("10000000.00");
                    if (val.compareTo(minFee) < 0 || val.compareTo(maxFee) > 0) {
                        throw new IllegalArgumentException(String.format(
                                "Default jockey hire fee (%,.0f VND) must be between 10,000 VND and 10,000,000 VND.", val));
                    }
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid format for default jockey hire fee. Please enter a valid numeric amount.");
                }
            }

            // Tìm bản ghi cấu hình trong DB theo khóa chính (Key), nếu chưa có thì tạo mới
            SystemConfig config = systemConfigRepository.findById(entry.getKey()).orElseGet(() -> {
                SystemConfig newCfg = new SystemConfig();
                newCfg.setConfigKey(entry.getKey());
                return newCfg;
            });
            config.setConfigValue(entry.getValue()); // Cập nhật giá trị mới
            config.setUpdatedAt(new Timestamp(System.currentTimeMillis())); // Cập nhật mốc thời gian sửa đổi
            systemConfigRepository.save(config); // Lưu vào CSDL
        }
    }
}
