package com.horseracing.backend.controller;

import com.horseracing.backend.dto.SystemConfigDTO;
import com.horseracing.backend.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Controller SystemConfigController - Lớp kiểm soát các endpoint cấu hình tham số hệ thống.
 * - Cho phép truy xuất danh sách các tham số cấu hình mặc định (phần trăm phân bổ tiền thưởng, giới hạn tuổi, hệ số handicap...).
 */
@RestController // Đánh dấu lớp là REST Controller xử lý các HTTP request
@RequestMapping("/api/configs") // Cấu hình URL cơ sở là /api/configs
@RequiredArgsConstructor // Tự động tạo constructor injection cho systemConfigService
@CrossOrigin(origins = "*") // Hỗ trợ CORS đa nguồn
public class SystemConfigController {

    private final SystemConfigService systemConfigService; // Khai báo dịch vụ cấu hình hệ thống

    // Lấy toàn bộ danh sách tham số cấu hình của hệ thống
    @GetMapping // Xử lý yêu cầu HTTP GET gửi tới /api/configs
        public ResponseEntity<List<SystemConfigDTO>> getConfigs() {
        // Trả về mã HTTP 200 OK kèm danh sách DTO cấu hình tham số hệ thống
        return ResponseEntity.ok(systemConfigService.getAllConfigs());
    }
}
