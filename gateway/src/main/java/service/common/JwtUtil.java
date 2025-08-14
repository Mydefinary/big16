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
    
    // 🔥 지연 로딩으로 변경 - 기존 방식 유지하면서 환경변수 지원 추가
    private static volatile Dotenv dotenv;
    private static volatile String SECRET_KEY;
    private static volatile SecretKey signingKey;
    
    // 🔑 지연 초기화로 시크릿 키 로드 (기존 방식 + 환경변수 지원)
    private static synchronized void initializeKeys() {
        if (SECRET_KEY == null) {
            // 1순위: 환경변수에서 JWT_SECRET 읽기 (Kubernetes/Docker 환경)
            SECRET_KEY = System.getenv("JWT_SECRET");
            
            // 2순위: .env 파일에서 읽기 (기존 방식 유지)
            if (SECRET_KEY == null || SECRET_KEY.isEmpty()) {
                try {
                    if (dotenv == null) {
                        dotenv = Dotenv.load();
                    }
                    SECRET_KEY = dotenv.get("JWT_SECRET");
                } catch (Exception e) {
                    System.out.println("⚠️ .env 파일 로드 실패: " + e.getMessage());
                }
            }
            
            // 3순위: 오류 발생
            if (SECRET_KEY == null || SECRET_KEY.isEmpty()) {
                throw new IllegalStateException("JWT_SECRET이 설정되어 있지 않습니다. 환경변수 또는 .env 파일에 설정해주세요.");
            }
            
            // SecretKey 생성
            signingKey = Keys.hmacShaKeyFor(SECRET_KEY.getBytes(StandardCharsets.UTF_8));
            
            // 초기화 완료 로그
            String source = System.getenv("JWT_SECRET") != null ? "환경변수" : ".env 파일";
            System.out.println("✅ JWT 키 초기화 완료 (" + source + ", 길이: " + SECRET_KEY.length() + ")");
        }
    }

    // userId 추출
    public static Long getUserIdFromToken(String token) {
        Claims claims = parseToken(token);
        return Long.parseLong(claims.getSubject());
    }

    // 토큰 유효성 검증 (기존 디버깅 로그 유지)
    public static boolean validateToken(String token) {
        try {
            // 키 초기화 (사용 시점에)
            initializeKeys();
            
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
        initializeKeys(); // 🔥 사용 시점에 초기화
        return Jwts.parserBuilder()
                .setSigningKey(signingKey)
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    // 내부: 시크릿 체크 (기존 로직 유지하되 지연 로딩 적용)
    private static void checkSecret() {
        initializeKeys(); // 🔥 사용 시점에 초기화
        if (SECRET_KEY == null || SECRET_KEY.isEmpty()) {
            throw new IllegalStateException("JWT_SECRET 환경변수가 설정되어 있지 않습니다.");
        }
    }

    // 기존 디버그 메서드 유지 + 개선
    public static void debugSecretKey() {
        initializeKeys(); // 🔥 사용 시점에 초기화
        
        System.out.println("=== SECRET_KEY DEBUG ===");
        System.out.println("환경변수에서 읽음: " + (System.getenv("JWT_SECRET") != null));
        System.out.println("SECRET_KEY: " + SECRET_KEY);
        System.out.println("SECRET_KEY length: " + (SECRET_KEY != null ? SECRET_KEY.length() : 0));
        System.out.println("SECRET_KEY first 20 chars: " + 
             (SECRET_KEY != null && SECRET_KEY.length() > 20 ? 
             SECRET_KEY.substring(0, 20) : SECRET_KEY));
        System.out.println("SECRET_KEY hash: " + (SECRET_KEY != null ? SECRET_KEY.hashCode() : 0));
        System.out.println("========================");
    }
    
    // 🆕 환경변수 디버깅용 추가 메서드
    public static void debugEnvironmentVariables() {
        System.out.println("=== JWT 환경변수 디버그 ===");
        System.out.println("JWT_SECRET 환경변수 존재: " + (System.getenv("JWT_SECRET") != null));
        System.out.println("JWT_SECRET 환경변수 길이: " + 
            (System.getenv("JWT_SECRET") != null ? System.getenv("JWT_SECRET").length() : 0));
        
        // .env 파일 확인
        try {
            Dotenv testDotenv = Dotenv.load();
            String dotenvSecret = testDotenv.get("JWT_SECRET");
            System.out.println(".env 파일에서 JWT_SECRET 존재: " + (dotenvSecret != null));
            System.out.println(".env 파일에서 JWT_SECRET 길이: " + (dotenvSecret != null ? dotenvSecret.length() : 0));
        } catch (Exception e) {
            System.out.println(".env 파일 읽기 실패: " + e.getMessage());
        }
        
        System.out.println("========================");
    }
}