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

    // Lấy danh sách toàn bộ các cấu hình hệ thống dưới dạng DTO
    public List<SystemConfigDTO> getAllConfigs() {
        return systemConfigRepository.findAll().stream()
                .map(systemConfigMapper::toDTO)
                .collect(Collectors.toList());
    }

    // Cập nhật giá trị các tham số cấu hình hệ thống
    @Transactional
    public void updateConfigs(Map<String, String> configs) {
        // Duyệt qua từng khóa-giá trị cấu hình nhận được từ client
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            if ("DEFAULT_JOCKEY_HIRE_FEE".equalsIgnoreCase(entry.getKey())) {
                try {
                    java.math.BigDecimal val = new java.math.BigDecimal(entry.getValue());
                    java.math.BigDecimal minFee = new java.math.BigDecimal("100.00");
                    java.math.BigDecimal maxFee = new java.math.BigDecimal("10000.00");
                    if (val.compareTo(minFee) < 0 || val.compareTo(maxFee) > 0) {
                        throw new IllegalArgumentException(String.format(
                                "Default jockey hire fee ($%,.2f) must be between $100.00 and $10,000.00.", val));
                    }
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Invalid format for default jockey hire fee. Please enter a valid numeric amount.");
                }
            }

            // Tìm bản ghi cấu hình trong DB theo khóa chính (Key)
            Optional<SystemConfig> configOpt = systemConfigRepository.findById(entry.getKey());
            if (configOpt.isPresent()) {
                SystemConfig config = configOpt.get();
                config.setConfigValue(entry.getValue()); // Cập nhật giá trị mới
                config.setUpdatedAt(new Timestamp(System.currentTimeMillis())); // Cập nhật mốc thời gian sửa đổi
                systemConfigRepository.save(config); // Lưu bản ghi đã chỉnh sửa
            }
        }
    }
}
