package service.common;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.Claims;
import io.github.cdimascio.dotenv.Dotenv;

import java.util.Date;

public class JwtUtil {
    
    private static final Dotenv dotenv = Dotenv.load();
    private static final String SECRET_KEY = dotenv.get("JWT_SECRET");

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
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY.getBytes())
                .compact();
    }

    // Refresh Token 생성
    public static String generateRefreshToken(Long userId) {
        checkSecret();
        return Jwts.builder()
                .setSubject(userId.toString())
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + REFRESH_TOKEN_EXPIRATION))
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY.getBytes())
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
                .signWith(SignatureAlgorithm.HS256, SECRET_KEY.getBytes())
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
        } catch (Exception e) {
            return false;
        }
    }

    // 토큰 만료 여부
    public static boolean isTokenExpired(String token) {
        try {
            Claims claims = parseToken(token);
            return claims.getExpiration().before(new Date());
        } catch (Exception e) {
            return true;
        }
    }

    // 내부: 토큰 파싱
    private static Claims parseToken(String token) {
        checkSecret();
        return Jwts.parser()
                .setSigningKey(SECRET_KEY.getBytes())
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
