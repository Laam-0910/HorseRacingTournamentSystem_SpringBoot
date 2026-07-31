package com.horseracing.backend.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Component;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

/**
 * Lớp JwtTokenProvider - Bộ cung cấp và quản lý JWT Token (Json Web Token).
 * - Khởi tạo mã khóa ký dựa trên một chuỗi bí mật định sẵn sử dụng thuật toán HMAC-SHA.
 * - Phát hành JWT Token cho người dùng đăng nhập thành công chứa Username (Subject) và vai trò (Claims roleId).
 * - Trích xuất các thông tin Username và vai trò từ chuỗi JWT gửi lên từ Client.
 * - Kiểm duyệt tính hợp lệ và thời hạn sử dụng của chuỗi JWT Token.
 */
@Component
public class JwtTokenProvider {

    // Chuỗi khóa bí mật dùng để ký số và xác thực tính toàn vẹn của Token (tối thiểu 512-bit cho HS512)
    private final String jwtSecret = "SecretKeyToGenerateJWTsSecretKeyToGenerateJWTsSecretKeyToGenerateJWTs";
    
    // Thời gian hết hạn của token: 7 ngày (tính bằng mili-giây)
    private final int jwtExpirationInMs = 604800000; 
    
    // Khóa mã hóa dạng Key được khởi tạo từ chuỗi bí mật
    private final Key key = Keys.hmacShaKeyFor(jwtSecret.getBytes());

    // Khởi tạo JWT Token mới chứa Username và vai trò người dùng
    public String generateToken(String username, Integer roleId) {
        Date now = new Date(); // Thời điểm phát hành
        Date expiryDate = new Date(now.getTime() + jwtExpirationInMs); // Thời điểm hết hạn

        // Tạo claims tùy biến chứa thông tin vai trò người dùng
        Map<String, Object> claims = new HashMap<>();
        claims.put("roleId", roleId);

        // Xây dựng chuỗi Token dạng nén
        return Jwts.builder()
                .setClaims(claims) // Thiết lập thông tin đính kèm
                .setSubject(username) // Đặt chủ thể token là Username
                .setIssuedAt(now) // Ghi nhận thời gian khởi tạo
                .setExpiration(expiryDate) // Thiết lập hạn sử dụng
                .signWith(key, SignatureAlgorithm.HS512) // Ký số bằng khóa bí mật và thuật toán HS512
                .compact(); // Nén thành chuỗi JWT
    }

    // Trích xuất Username (Subject) từ chuỗi JWT Token
    public String getUsernameFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key) // Sử dụng khóa bí mật để xác thực chữ ký
                .build()
                .parseClaimsJws(token)
                .getBody(); // Trích xuất phần thân payload

        return claims.getSubject();
    }

    // Trích xuất Mã vai trò (roleId) từ chuỗi JWT Token
    public Integer getRoleIdFromJWT(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(key)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return (Integer) claims.get("roleId");
    }

    // Kiểm tra tính hợp lệ và thời hạn của chuỗi Token
    public boolean validateToken(String authToken) {
        try {
            // Thực hiện giải mã chữ ký, nếu không ném ra lỗi tức là token hợp lệ
            Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(authToken);
            return true;
        } catch (JwtException | IllegalArgumentException ex) {
            // Token không hợp lệ, chữ ký sai hoặc đã hết hạn
        }
        return false;
    }
}
