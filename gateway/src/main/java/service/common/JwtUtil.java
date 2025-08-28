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
    
    private static volatile Dotenv dotenv;
    private static volatile String SECRET_KEY;
    private static volatile SecretKey signingKey;
    
    private static synchronized void initializeKeys() {
        if (SECRET_KEY == null) {
            // 1순위: 환경변수에서 JWT_SECRET 읽기
            SECRET_KEY = System.getenv("JWT_SECRET");
            
            // 2순위: .env 파일에서 읽기
            if (SECRET_KEY == null || SECRET_KEY.isEmpty()) {
                try {
                    if (dotenv == null) {
                        dotenv = Dotenv.load();
                    }
                    SECRET_KEY = dotenv.get("JWT_SECRET");
                } catch (Exception e) {
                    // .env 파일 로드 실패는 조용히 처리
                }
            }
            
            // 3순위: 오류 발생
            if (SECRET_KEY == null || SECRET_KEY.isEmpty()) {
                throw new IllegalStateException("JWT_SECRET이 설정되어 있지 않습니다. 환경변수 또는 .env 파일에 설정해주세요.");
            }
            
            // SecretKey 생성
            signingKey = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
        }
    }

    // userId 추출
    public static Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return Long.parseLong(claims.getSubject());
    }

    // 토큰 유효성 검증 (로그 제거)
    public static boolean validateToken(String token) {
        try {
            initializeKeys();
            
            Claims claims = parseToken(token);
            
            // 만료 시간 체크
            if (claims.getExpiration().before(new Date())) {
                return false;
            }
            
            return true;
            
        } catch (Exception e) {
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
        initializeKeys();
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 내부: 시크릿 체크
    private static void checkSecret() {
        initializeKeys();
        if (SECRET_KEY == null || SECRET_KEY.isEmpty()) {
            throw new IllegalStateException("JWT_SECRET 환경변수가 설정되어 있지 않습니다.");
        }
    }
}