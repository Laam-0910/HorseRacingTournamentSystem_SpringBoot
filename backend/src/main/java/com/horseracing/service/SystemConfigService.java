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

@Service
@RequiredArgsConstructor
public class SystemConfigService {

    private final SystemConfigRepository systemConfigRepository;
    private final SystemConfigMapper systemConfigMapper;

    public List<SystemConfigDTO> getAllConfigs() {
        return systemConfigRepository.findAll().stream()
                .map(systemConfigMapper::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public void updateConfigs(Map<String, String> configs) {
        for (Map.Entry<String, String> entry : configs.entrySet()) {
            Optional<SystemConfig> configOpt = systemConfigRepository.findById(entry.getKey());
            if (configOpt.isPresent()) {
                SystemConfig config = configOpt.get();
                config.setConfigValue(entry.getValue());
                config.setUpdatedAt(new Timestamp(System.currentTimeMillis()));
                systemConfigRepository.save(config);
            }
        }
    }
}
