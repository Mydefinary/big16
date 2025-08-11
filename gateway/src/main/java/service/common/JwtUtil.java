package service.common;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.JwtException;
import io.github.cdimascio.dotenv.Dotenv;
import javax.crypto.SecretKey;
import java.util.Date;
import java.nio.charset.StandardCharsets;

public class JwtUtil {
    
    private static final Dotenv dotenv = Dotenv.load();
    private static final String SECRET_KEY = dotenv.get("JWT_SECRET");
    
    // 🔑 JJWT 0.11+에서는 SecretKey 객체 사용
    private static final SecretKey signingKey = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));

    // userId 추출
    public static Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return Long.parseLong(claims.getSubject());
    }

    // 토큰 유효성 검증 (디버깅 로그 추가)
    public static boolean validateToken(String token) {
        try {
            System.out.println("🔍 JWT Validation Debug:");
            System.out.println("   Token: " + token.substring(0, Math.min(20, token.length())) + "...");
            System.out.println("   SECRET_KEY exists: " + (SECRET_KEY != null && !SECRET_KEY.isEmpty()));
            System.out.println("   SECRET_KEY length: " + (SECRET_KEY != null ? SECRET_KEY.length() : 0));
            
            Claims claims = parseToken(token);
            
            System.out.println("   Token subject: " + claims.getSubject());
            System.out.println("   Token expiration: " + claims.getExpiration());
            System.out.println("   Current time: " + new Date());
            System.out.println("   Is expired: " + claims.getExpiration().before(new Date()));
            
            // 만료 시간 체크
            if (claims.getExpiration().before(new Date())) {
                System.out.println("❌ Token expired");
                return false;
            }
            
            System.out.println("✅ Token validation successful");
            return true;
            
        } catch (JwtException e) {
            System.out.println("❌ JWT Exception: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            return false;
        } catch (IllegalArgumentException e) {
            System.out.println("❌ Illegal Argument: " + e.getMessage());
            return false;
        } catch (Exception e) {
            System.out.println("❌ Unexpected error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            return false;
        }
    }

    // 토큰 만료 여부
    public static boolean isTokenExpired(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.getExpiration().before(new Date());
        } catch (JwtException | IllegalArgumentException e) {
            return true;
        }
    }

    // 내부: 토큰 파싱
    private static Claims parseToken(String token) {
        checkSecret();
        return Jwts.parserBuilder()
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

    public static void debugSecretKey() {
        System.out.println("=== SECRET_KEY DEBUG ===");
        System.out.println("SECRET_KEY: " + SECRET_KEY);
        System.out.println("SECRET_KEY length: " + (SECRET_KEY != null ? SECRET_KEY.length() : 0));
        System.out.println("SECRET_KEY first 20 chars: " + 
            (SECRET_KEY != null && SECRET_KEY.length() > 20 ? 
            SECRET_KEY.substring(0, 20) : SECRET_KEY));
        System.out.println("SECRET_KEY hash: " + (SECRET_KEY != null ? SECRET_KEY.hashCode() : 0));
        System.out.println("========================");
    }
}