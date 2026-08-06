package com.horseracing.backend.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import java.util.Arrays;

/**
 * Cấu hình bảo mật SecurityConfig - Spring Security.
 * - Cho phép truy cập không qua kiểm tra token đối với một số endpoint công khai (auth, public data, websocket chat).
 * - Cấu hình bộ lọc JWT Authentication Filter để xử lý kiểm tra mã Token Bearer trước UsernamePasswordAuthenticationFilter.
 * - Thiết lập cấu hình CORS (Cross-Origin Resource Sharing) cho các cổng phát triển frontend (ví dụ: localhost:5173).
 * - Cấu hình bộ mã hóa mật khẩu PasswordEncoder hỗ trợ mã hóa BCrypt và tương thích ngược với mật khẩu dạng thuần túy.
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter; // Bộ lọc xác thực JWT Token tự định nghĩa

    // Định cấu hình chuỗi bộ lọc bảo mật chính của Spring Security
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 1. Kích hoạt CORS sử dụng cấu hình tùy biến bên dưới
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            // 2. Tắt CSRF (Cross-Site Request Forgery) do sử dụng cơ chế stateless JWT
            .csrf(csrf -> csrf.disable())
            // 3. Không sử dụng HTTP Session để lưu trữ thông tin xác thực (Stateless)
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            // 4. Định nghĩa quyền truy cập các đường dẫn
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll() // Cho phép đăng nhập, đăng ký, quên mật khẩu truy cập tự do
                .requestMatchers("/api/public/**").permitAll() // Cho phép xem thống kê, lịch thi đấu công khai
                .requestMatchers("/api/ai/**").permitAll() // Cho phép gửi chat/predict không cần token
                .requestMatchers("/ai/**").permitAll()
                .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/races/**").permitAll() // Cho phép xem các trận đua công khai
                .requestMatchers("/ws/chat/**").permitAll() // Cho phép kết nối WebSocket phòng chat công khai
                .requestMatchers("/ws/livestream/**").permitAll() // Cho phép kết nối WebSocket livestream công khai
                .requestMatchers("/api/betting/**").permitAll() // Cho phép xem tỉ lệ cược và dữ liệu cá cược công khai
                .anyRequest().authenticated() // Mọi yêu cầu API khác đều phải xác thực qua Token
            )
            // 5. Đăng ký bộ lọc JWT trước bộ lọc UsernamePasswordAuthenticationFilter
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    // Cấu hình CORS để chia sẻ tài nguyên giữa Backend và Frontend (React)
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        // Cho phép tất cả các nguồn gốc (localhost và IP mạng 192.168.x.x của máy tính khi kết nối từ điện thoại)
        configuration.setAllowedOriginPatterns(Arrays.asList("*"));
        // Cho phép các phương thức HTTP cơ bản
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        // Cho phép các header cần thiết
        configuration.setAllowedHeaders(Arrays.asList("Authorization", "Content-Type", "Cache-Control", "Accept", "X-Requested-With"));
        // Phơi bày tiêu đề Authorization ở client
        configuration.setExposedHeaders(Arrays.asList("Authorization"));
        configuration.setAllowCredentials(true);
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration); // Áp dụng cho mọi endpoint
        return source;
    }

    // Bộ mã hóa và so khớp mật khẩu tùy biến
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new PasswordEncoder() {
            private final BCryptPasswordEncoder bcrypt = new BCryptPasswordEncoder(); // Đối tượng BCrypt gốc

            @Override
            public String encode(CharSequence rawPassword) {
                return bcrypt.encode(rawPassword); // Thực hiện băm BCrypt mật khẩu thuần
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                if (encodedPassword == null) return false;
                // Nếu mật khẩu trong cơ sở dữ liệu chưa được băm bằng BCrypt (dành cho dữ liệu cũ/test)
                if (!encodedPassword.startsWith("$2a$") && !encodedPassword.startsWith("$2b$") && !encodedPassword.startsWith("$2y$")) {
                    return rawPassword.toString().equals(encodedPassword); // So khớp chuỗi thuần trực tiếp
                }
                return bcrypt.matches(rawPassword, encodedPassword); // So khớp bằng thuật toán BCrypt
            }
        };
    }
}
