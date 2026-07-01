package com.horseracing.backend.mapper;

import com.horseracing.backend.dto.SystemConfigDTO;
import com.horseracing.backend.entity.SystemConfig;
import org.springframework.stereotype.Component;

@Component
public class SystemConfigMapper {

    public SystemConfigDTO toDTO(SystemConfig config) {
        if (config == null) {
            return null;
        }
        return SystemConfigDTO.builder()
                .configKey(config.getConfigKey())
                .configValue(config.getConfigValue())
                .description(config.getDescription())
                .updatedAt(config.getUpdatedAt())
                .build();
    }

    public SystemConfig toEntity(SystemConfigDTO dto) {
        if (dto == null) {
            return null;
        }
        SystemConfig config = new SystemConfig();
        config.setConfigKey(dto.getConfigKey());
        config.setConfigValue(dto.getConfigValue());
        config.setDescription(dto.getDescription());
        config.setUpdatedAt(dto.getUpdatedAt());
        return config;
    }
}
