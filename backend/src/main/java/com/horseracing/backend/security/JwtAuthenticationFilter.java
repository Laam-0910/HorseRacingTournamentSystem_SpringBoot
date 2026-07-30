package com.horseracing.backend.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;
import java.util.Collections;

/**
 * Bộ lọc JwtAuthenticationFilter - Kế thừa từ OncePerRequestFilter để đảm bảo bộ lọc chạy một lần duy nhất cho mỗi yêu cầu HTTP.
 * - Kiểm tra tiêu đề Authorization của mỗi yêu cầu HTTP nhận được để tìm chuỗi Bearer Token.
 * - Sử dụng JwtTokenProvider để giải mã và kiểm tra tính hợp lệ của Token.
 * - Xác định Username và vai trò phân quyền người dùng tương ứng (roleId).
 * - Khởi tạo đối tượng UsernamePasswordAuthenticationToken và đính kèm vào SecurityContextHolder để các bộ lọc phía sau của Spring Security nhận biết được phiên đã đăng nhập thành công.
 */
@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    @Autowired
    private JwtTokenProvider tokenProvider; // Tiện ích xử lý mã JWT Token

    // Thực hiện logic xử lý bộ lọc cho mỗi yêu cầu HTTP
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        try {
            // 1. Trích xuất chuỗi JWT Token từ Header của HTTP request
            String jwt = getJwtFromRequest(request);

            // 2. Kiểm tra chuỗi Token có tồn tại và hợp lệ hay không
            if (StringUtils.hasText(jwt) && tokenProvider.validateToken(jwt)) {
                // Trích xuất username và roleId từ payload của Token
                String username = tokenProvider.getUsernameFromJWT(jwt);
                Integer roleId = tokenProvider.getRoleIdFromJWT(jwt);

                // 3. Ánh xạ vai trò từ ID sang tên vai trò dạng chuẩn Spring Security (ROLE_...)
                // Admin=1, Owner=2, Jockey=3, Spectator=4, Referee=5
                String roleName = "ROLE_MEMBER";
                if (roleId == 1) roleName = "ROLE_ADMIN";
                else if (roleId == 2) roleName = "ROLE_OWNER";
                else if (roleId == 3) roleName = "ROLE_JOCKEY";
                else if (roleId == 4) roleName = "ROLE_SPECTATOR";
                else if (roleId == 5) roleName = "ROLE_REFEREE";

                // Khởi tạo đối tượng phân quyền
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority(roleName);
                
                // Khởi tạo đối tượng đại diện cho thông tin xác thực
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        username, null, Collections.singletonList(authority));
                
                // Đính kèm chi tiết yêu cầu HTTP (IP, Session...) vào đối tượng xác thực
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                
                // Đưa thông tin xác thực vào Security Context của Spring
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception ex) {
            logger.error("Could not set user authentication in security context", ex);
        }

        // Chuyển tiếp yêu cầu HTTP đến bộ lọc tiếp theo trong chuỗi bộ lọc
        filterChain.doFilter(request, response);
    }

    // Hàm tiện ích trích xuất mã JWT từ tiêu đề "Authorization" (Ví dụ: "Bearer xyz..." -> "xyz...")
    private String getJwtFromRequest(HttpServletRequest request) {
        String bearerToken = request.getHeader("Authorization");
        if (StringUtils.hasText(bearerToken) && bearerToken.startsWith("Bearer ")) {
            return bearerToken.substring(7); // Bỏ qua 7 ký tự đầu tiên để lấy chuỗi Token
        }
        return null;
    }
}
