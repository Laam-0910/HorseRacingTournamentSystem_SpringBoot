package com.horseracing.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * Lớp cấu hình WebSocketConfig - Kích hoạt tính năng kết nối hai chiều WebSocket.
 * - Cho phép máy khách kết nối trực tiếp đến kênh Chat của từng trận đấu cụ thể theo raceId.
 * - Cấu hình nguồn gốc được cho phép (AllowedOrigins) là tất cả các miền (*).
 */
@Configuration
@EnableWebSocket // Kích hoạt máy chủ WebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private ChatWebSocketHandler chatWebSocketHandler; // Bộ xử lý nhận/gửi thông điệp chat WebSocket

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Đăng ký đường dẫn endpoint `/ws/chat/{raceId}` cùng với bộ xử lý tương ứng
        registry.addHandler(chatWebSocketHandler, "/ws/chat/{raceId}")
                .setAllowedOrigins("*"); // Cho phép kết nối từ mọi nguồn gốc (CORS policy)
    }
}
