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
@Tag(
    name = "02. System Config Service",
    description = "⚙️ **BƯỚC 2: CẤU HÌNH THAM SỐ HỆ THỐNG (SYSTEM CONFIG ARCHITECTURE)**\n\n" +
                  "📌 **CÁC CLASS MÃ NGUỒN LIÊN QUAN:**\n" +
                  "* **Controllers**: `SystemConfigController.java`, `AdminUserController.java`\n" +
                  "* **Services**: `SystemConfigService.java` (`SystemConfigServiceImpl.java`)\n" +
                  "* **Repositories**: `SystemConfigRepository.java`\n" +
                  "* **Entities**: `SystemConfig.java`\n" +
                  "* **DTOs**: `SystemConfigDTO.java`\n\n" +
                  "🔄 **LUỒNG XỬ LÝ NGHIỆP VỤ CHÍNH (BUSINESS FLOW):**\n" +
                  "1. Admin tải các tham số cấu hình mặc định (Phần trăm chia tiền thưởng, Hạn mức đăng ký, Giới hạn thời gian...).\n" +
                  "2. Cho phép xem danh sách cấu hình và cập nhật tham số vận hành cho toàn bộ giải đua."
)
public class SystemConfigController {

    private final SystemConfigService systemConfigService;

    @GetMapping
    @Operation(
        summary = "GET: Lấy danh sách tham số cấu hình hệ thống",
        description = "🔍 **Chạy thử Try It Out**: Bấm 'Try it out' -> 'Execute' để xem danh sách tham số cấu hình hệ thống.\n\n" +
                      "📌 **CÁC CLASS MÃ NGUỒN XỬ LÝ:**\n" +
                      "* **Controller**: `SystemConfigController.getConfigs()`\n" +
                      "* **Service**: `SystemConfigService.getAllConfigs()` (`SystemConfigServiceImpl.java`)\n" +
                      "* **Repository**: `SystemConfigRepository.findAll()`\n" +
                      "* **DTO Response**: `List<SystemConfigDTO>`"
    )
    public ResponseEntity<List<SystemConfigDTO>> getConfigs() {
        return ResponseEntity.ok(systemConfigService.getAllConfigs());
    }
}
