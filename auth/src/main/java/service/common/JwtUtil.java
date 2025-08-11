package service.common;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
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

    private static final long ACCESS_TOKEN_EXPIRATION = 1000 * 60 * 60; // 1시간
    private static final long REFRESH_TOKEN_EXPIRATION = 1000 * 60 * 60 * 24 * 7; // 7일
    private static final long EMAIL_TOKEN_EXPIRATION = 1000 * 60 * 10; // 10분

    // Access Token 생성
    public static String generateToken(Long userId) {
        checkSecret();
        return Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION))
                .signWith(signingKey, SignatureAlgorithm.HS256)  // 🆕 SecretKey 사용
                .compact();
    }

    // Refresh Token 생성
    public static String generateRefreshToken(Long userId) {
        checkSecret();
        return Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(signingKey, SignatureAlgorithm.HS256)  // 🆕 SecretKey 사용
                .compact();
    }

    // 이메일 인증용 토큰 생성
    public static String generateEmailToken(String email) {
        checkSecret();
        return Jwts.builder()
                .setSubject(email)
                .claim("type", "email-verification")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EMAIL_TOKEN_EXPIRATION))
                .signWith(signingKey, SignatureAlgorithm.HS256)  // 🆕 SecretKey 사용
                .compact();
    }

    // 이메일 토큰에서 이메일 추출
    public static String getEmailFromToken(String token) {
        Claims claims = parseToken(token);
        if (!"email-verification".equals(claims.get("type"))) {
            throw new IllegalArgumentException("유효하지 않은 이메일 인증 토큰입니다.");
        }
        return claims.getSubject();
    }

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