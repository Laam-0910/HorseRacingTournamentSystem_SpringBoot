package com.horseracing.backend.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import org.springframework.context.annotation.Bean;
import org.springframework.web.socket.server.standard.ServletServerContainerFactoryBean;

/**
 * Lớp cấu hình WebSocketConfig - Kích hoạt tính năng kết nối hai chiều WebSocket.
 * - Cho phép máy khách kết nối trực tiếp đến kênh Chat của từng trận đấu cụ thể theo raceId.
 * - Cấu hình nguồn gốc được cho phép (AllowedOrigins) là tất cả các miền (*).
 * - Cấu hình kích thước bộ đệm thông điệp lớn (10MB) hỗ trợ truyền khung hình camera.
 */
@Configuration
@EnableWebSocket // Kích hoạt máy chủ WebSocket
public class WebSocketConfig implements WebSocketConfigurer {

    @Autowired
    private ChatWebSocketHandler chatWebSocketHandler; // Bộ xử lý nhận/gửi thông điệp chat WebSocket

    @Autowired
    private LivestreamWebSocketHandler livestreamWebSocketHandler; // Bộ xử lý tín hiệu livestream WebRTC

    @Bean
    public ServletServerContainerFactoryBean createWebSocketContainer() {
        ServletServerContainerFactoryBean container = new ServletServerContainerFactoryBean();
        container.setMaxTextMessageBufferSize(10 * 1024 * 1024); // 10MB
        container.setMaxBinaryMessageBufferSize(10 * 1024 * 1024); // 10MB
        return container;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        // Đăng ký đường dẫn endpoint `/ws/chat/{raceId}` cùng với bộ xử lý tương ứng
        registry.addHandler(chatWebSocketHandler, "/ws/chat/{raceId}")
                .setAllowedOrigins("*"); // Cho phép kết nối từ mọi nguồn gốc (CORS policy)

        // Đăng ký đường dẫn endpoint `/ws/livestream/{raceId}` cho truyền luồng phát trực tiếp
        registry.addHandler(livestreamWebSocketHandler, "/ws/livestream/{raceId}")
                .setAllowedOrigins("*");
    }
}
