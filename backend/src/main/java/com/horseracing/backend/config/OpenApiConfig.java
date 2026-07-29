package com.horseracing.backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Lớp cấu hình OpenApiConfig - Cấu hình Swagger/OpenAPI.
 * - Hỗ trợ sinh tài liệu mô tả API (API Documentation) tự động cho toàn bộ dự án Spring Boot.
 * - Đăng ký cơ chế bảo mật xác thực JWT Token (Bearer Auth) trên giao diện Swagger UI để kiểm thử API cần phân quyền.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        final String securitySchemeName = "bearerAuth"; // Tên định danh cho cấu hình bảo mật
        return new OpenAPI()
                .info(new Info()
                        .title("Horse Racing Tournament API") // Tiêu đề tài liệu API
                        .version("1.0") // Phiên bản API
                        .description("API Documentation for Horse Racing Tournament Management System")) // Mô tả hệ thống
                // Kích hoạt yêu cầu bảo mật chung cho toàn bộ endpoint
                .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
                // Khai báo cấu trúc xác thực JWT Bearer token
                .components(new Components()
                        .addSecuritySchemes(securitySchemeName,
                                new SecurityScheme()
                                        .name(securitySchemeName)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")));
    }
}
