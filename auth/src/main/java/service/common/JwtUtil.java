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
    
    private static volatile String secretKey;
    private static volatile SecretKey signingKey;

    private static synchronized void initializeKeys() {
        if (secretKey == null) {
            // 1. 환경변수에서 JWT_SECRET 읽기
            secretKey = System.getenv("JWT_SECRET");
            
            // 2. .env 파일에서 읽기 시도
            if (secretKey == null || secretKey.isEmpty()) {
                try {
                    Class<?> dotenvClass = Class.forName("io.github.cdimascio.dotenv.Dotenv");
                    Object dotenv = dotenvClass.getMethod("load").invoke(null);
                    secretKey = (String) dotenvClass.getMethod("get", String.class).invoke(dotenv, "JWT_SECRET");
                } catch (Exception e) {
                    // 조용히 실패 처리
                }
            }
            
            // 3. 시크릿 키 검증
            if (secretKey == null || secretKey.isEmpty()) {
                throw new IllegalStateException(
                    "JWT_SECRET 환경변수가 설정되어 있지 않습니다. " +
                    "Kubernetes에서 Secret으로 JWT_SECRET를 설정해주세요."
                );
            }
            
            if (secretKey.length() < 32) {
                throw new IllegalStateException("JWT_SECRET은 최소 32자 이상이어야 합니다.");
            }
            
            // 4. SecretKey 생성
            signingKey = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
        }
    }

    // Access Token 생성
    public static String generateToken(Long userId) {
        initializeKeys();
        return Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // Refresh Token 생성
    public static String generateRefreshToken(Long userId) {
        initializeKeys();
        return Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // 이메일 인증용 토큰 생성
    public static String generateEmailToken(String email) {
        initializeKeys();
        return Jwts.builder()
                .setSubject(email)
                .claim("type", "email-verification")
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + EMAIL_TOKEN_EXPIRATION))
                .signWith(signingKey, SignatureAlgorithm.HS256)
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
        initializeKeys();
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }
}