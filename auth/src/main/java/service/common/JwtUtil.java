// JwtUtil.java

package service.common;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.JwtException;

import javax.crypto.SecretKey;
import java.util.Date;
import java.nio.charset.StandardCharsets;

public class JwtUtil {
    
    private static final long ACCESS_TOKEN_EXPIRATION = 1000 * 60 * 60; // 1시간
    private static final long REFRESH_TOKEN_EXPIRATION = 1000 * 60 * 60 * 24 * 7; // 7일
    private static final long EMAIL_TOKEN_EXPIRATION = 1000 * 60 * 10; // 10분
    
    // 🔑 Lazy initialization으로 안전한 키 관리
    private static volatile SecretKey signingKey;
    private static volatile String secretKey;
    
    // 🔑 안전한 시크릿 키 가져오기
    private static String getSecretKey() {
        if (secretKey == null) {
            synchronized (JwtUtil.class) {
                if (secretKey == null) {
                    String envSecret = System.getenv("JWT_SECRET");
                    if (envSecret != null && envSecret.length() >= 32) {
                        secretKey = envSecret;
                    } else {
                        secretKey = "your-super-secret-jwt-key-here-make-it-long-and-secure-at-least-32-characters-for-hmac-sha256";
                    }
                }
            }
        }
        return secretKey;
    }
    
    // 🔑 안전한 SigningKey 가져오기
    private static SecretKey getSigningKey() {
        if (signingKey == null) {
            synchronized (JwtUtil.class) {
                if (signingKey == null) {
                    try {
                        String key = getSecretKey();
                        signingKey = Keys.hmacShaKeyFor(key.getBytes(StandardCharsets.UTF_8));
                        System.out.println("JWT SigningKey 초기화 성공");
                    } catch (Exception e) {
                        System.err.println("JWT 키 생성 실패: " + e.getMessage());
                        e.printStackTrace();
                        throw new IllegalStateException("JWT 키 초기화 실패", e);
                    }
                }
            }
        }
        return signingKey;
    }

    // Access Token 생성
    public static String generateToken(Long userId) {
        try {
            return Jwts.builder()
                    .setSubject(userId.toString())
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION))
                    .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                    .compact();
        } catch (Exception e) {
            System.err.println("Access Token 생성 실패: " + e.getMessage());
            throw new RuntimeException("Access Token 생성 실패", e);
        }
    }

    // Refresh Token 생성
    public static String generateRefreshToken(Long userId) {
        try {
            return Jwts.builder()
                    .setSubject(userId.toString())
                    .claim("type", "refresh") // ✅ 타입 명시 추가
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                    .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                    .compact();
        } catch (Exception e) {
            System.err.println("Refresh Token 생성 실패: " + e.getMessage());
            throw new RuntimeException("Refresh Token 생성 실패", e);
        }
    }

    // 이메일 인증용 토큰 생성
    public static String generateEmailToken(String email) {
        try {
            return Jwts.builder()
                    .setSubject(email)
                    .claim("type", "email-verification")
                    .setIssuedAt(new Date())
                    .setExpiration(new Date(System.currentTimeMillis() + EMAIL_TOKEN_EXPIRATION))
                    .signWith(getSigningKey(), SignatureAlgorithm.HS256)
                    .compact();
        } catch (Exception e) {
            System.err.println("Email Token 생성 실패: " + e.getMessage());
            throw new RuntimeException("Email Token 생성 실패", e);
        }
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
        } catch (JwtException | IllegalArgumentException e) {
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
        try {
            return Jwts.parserBuilder()
                    .setSigningKey(getSigningKey())
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (Exception e) {
            System.err.println("토큰 파싱 실패: " + e.getMessage());
            throw new IllegalArgumentException("유효하지 않은 토큰입니다.", e);
        }
    }
}