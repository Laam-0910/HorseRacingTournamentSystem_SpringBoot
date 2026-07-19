package com.horseracing.backend.controller;

import com.horseracing.backend.dto.SystemConfigDTO;
import com.horseracing.backend.service.SystemConfigService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/configs")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Tag(name = "System Config Service", description = "Lấy cấu hình tham số hệ thống")
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    @GetMapping
    @Operation(summary = "Lấy danh sách tham số cấu hình hệ thống", description = "📌 **Code Handler**: `SystemConfigController.getConfigs()` -> `SystemConfigService.getAllConfigs()`")
    public ResponseEntity<List<SystemConfigDTO>> getConfigs() {
        return ResponseEntity.ok(systemConfigService.getAllConfigs());
    }
}
