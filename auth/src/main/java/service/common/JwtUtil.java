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
    
    // 🔥 정적 초기화를 지연 로딩으로 변경
    private static volatile String secretKey;
    private static volatile SecretKey signingKey;

    // 🔑 지연 초기화로 시크릿 키 로드
    private static synchronized void initializeKeys() {
        if (secretKey == null) {
            // 1. 환경변수에서 JWT_SECRET 읽기 (우선순위 1)
            secretKey = System.getenv("JWT_SECRET");
            
            // 2. .env 파일에서 읽기 시도 (우선순위 2) - 안전한 방식
            if (secretKey == null || secretKey.isEmpty()) {
                try {
                    // Dotenv 라이브러리가 있을 때만 사용
                    Class<?> dotenvClass = Class.forName("io.github.cdimascio.dotenv.Dotenv");
                    Object dotenv = dotenvClass.getMethod("load").invoke(null);
                    secretKey = (String) dotenvClass.getMethod("get", String.class).invoke(dotenv, "JWT_SECRET");
                } catch (Exception e) {
                    System.out.println("Dotenv 로드 실패 (정상적임): " + e.getMessage());
                }
            }
            
            // 3. 기본값 설정 또는 예외 발생
            if (secretKey == null || secretKey.isEmpty()) {
                throw new IllegalStateException(
                    "JWT_SECRET 환경변수가 설정되어 있지 않습니다. " +
                    "Kubernetes에서 Secret으로 JWT_SECRET를 설정해주세요."
                );
            }
            
            // 4. 시크릿 키 길이 검증 (HMAC-SHA256은 최소 32바이트 권장)
            if (secretKey.length() < 32) {
                System.out.println("⚠️  경고: JWT_SECRET이 32자보다 짧습니다. 보안상 32자 이상을 권장합니다.");
            }
            
            // 5. SecretKey 생성
            signingKey = Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
            
            System.out.println("✅ JWT 키 초기화 완료 (길이: " + secretKey.length() + ")");
        }
    }

    // Access Token 생성
    public static String generateToken(Long userId) {
        initializeKeys(); // 🔥 사용 시점에 초기화
        return Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + ACCESS_TOKEN_EXPIRATION))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // Refresh Token 생성
    public static String generateRefreshToken(Long userId) {
        initializeKeys(); // 🔥 사용 시점에 초기화
        return Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(signingKey, SignatureAlgorithm.HS256)
                .compact();
    }

    // 이메일 인증용 토큰 생성
    public static String generateEmailToken(String email) {
        initializeKeys(); // 🔥 사용 시점에 초기화
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
        initializeKeys(); // 🔥 사용 시점에 초기화
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 디버그용: 환경변수 확인
    public static void debugEnvironmentVariables() {
        System.out.println("=== JWT 환경변수 디버그 ===");
        System.out.println("JWT_SECRET 환경변수 존재: " + (System.getenv("JWT_SECRET") != null));
        System.out.println("JWT_SECRET 길이: " + 
            (System.getenv("JWT_SECRET") != null ? System.getenv("JWT_SECRET").length() : 0));
        
        // 다른 중요한 환경변수들도 확인
        System.out.println("SERVER_PORT: " + System.getenv("SERVER_PORT"));
        System.out.println("spring.datasource.url: " + System.getenv("spring.datasource.url"));
        System.out.println("spring.datasource.username: " + System.getenv("spring.datasource.username"));
        System.out.println("GMAIL_USERNAME: " + System.getenv("GMAIL_USERNAME"));
        System.out.println("========================");
    }
}