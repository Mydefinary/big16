package service.common;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.JwtException;
import javax.crypto.SecretKey;
import java.util.Date;
import java.nio.charset.StandardCharsets;

public class JwtUtil {
    
    // ✅ 환경변수 접근 방식 수정 (dotenv 대신 System.getenv 사용)
    private static final String SECRET_KEY = System.getenv("JWT_SECRET") != null 
        ? System.getenv("JWT_SECRET") 
        : "your-super-secret-jwt-key-here-make-it-long-and-secure-at-least-32-characters";
    
    // 🔑 JJWT 0.11+에서는 SecretKey 객체 사용
    private static final SecretKey signingKey = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));

    // userId 추출
    public static Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return Long.parseLong(claims.getSubject());
    }

    // 토큰 유효성 검증
    public static boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {  // 🆕 구체적인 예외 처리
            return false;
        }
    }

    // 토큰 만료 여부
    public static boolean isTokenExpired(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {  // 🆕 구체적인 예외 처리
            return true;
        }
    }
    // 주석추가
    // 내부: 토큰 파싱
    private static Claims parseToken(String token) {
        checkSecret();
        return Jwts.parserBuilder()  // 🆕 parserBuilder() 사용
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 내부: 시크릿 체크
    private static void checkSecret() {
        if (SECRET_KEY == null || SECRET_KEY.isEmpty()) {
            throw new IllegalStateException("JWT_SECRET 환경변수가 설정되어 있지 않습니다.");
        }
    }
}