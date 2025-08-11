package service.filter;

import service.common.JwtUtil;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    public JwtAuthenticationFilter() {
        super(Config.class);
    }

    private boolean isPublicPath(String path) {
        // 루트 경로
        if (path.equals("/") || path.isEmpty()) {
            return true;
        }
        
        // API 공개 경로
        if (path.startsWith("/auths/login") ||
            path.startsWith("/auths/refresh") ||
            path.startsWith("/auths/verify-code") ||
            path.startsWith("/auths/reset-password") ||
            path.startsWith("/auths/resend-code") ||
            path.startsWith("/users/register") ||
            path.startsWith("/users/check-email") ||
            path.startsWith("/users/find-id")) {
            return true;
        }
        
        // Vite 개발 서버 전용 경로들 🎯
        if (path.startsWith("/@") ||                    // /@react-refresh, /@vite/client
            path.startsWith("/src/") ||                 // /src/main.jsx 등 소스 파일
            path.startsWith("/node_modules/") ||        // node_modules 파일들
            path.contains("vite")) {                   // vite 관련 모든 파일
            return true;
        }
        
        // 정적 파일 (확장자 기반)
        if (path.contains(".")) {
            return true;
        }
        
        // React 라우트
        if (path.equals("/login") ||
            path.equals("/register") ||
            path.equals("/email-verification") ||
            path.equals("/find-id") ||
            path.equals("/find-password") ||
            path.equals("/main")) {
            return true;
        }
        
        return false;
    }

    // ✅ 쿠키에서 토큰을 가져오는 헬퍼 메서드
    private String getTokenFromCookie(ServerHttpRequest request, String cookieName) {
        if (request.getCookies() == null) {
            return null;
        }
        
        List<HttpCookie> cookies = request.getCookies().get(cookieName);
        if (cookies != null && !cookies.isEmpty()) {
            return cookies.get(0).getValue();
        }
        
        return null;
    }

    private Mono<Void> handleUnauthorized(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        
        // JSON 응답으로 에러 메시지 제공
        String body = "{\"error\":\"Unauthorized\",\"message\":\"유효하지 않은 토큰입니다.\"}";
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        response.getHeaders().add("Content-Type", "application/json");
        
        return response.writeWith(Mono.just(buffer));
    }

    public static class Config {
        // 필요시 설정 옵션 추가
    }

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            String path = request.getURI().getPath();
            String method = request.getMethod().toString();
            
            // 🚨 디버깅 로그 추가
            System.out.println("=== JWT Filter Debug ===");
            System.out.println("📍 Request Path: " + path);
            System.out.println("🔧 Request Method: " + method);
            System.out.println("🔍 Is Public Path: " + isPublicPath(path));
            
            if (isPublicPath(path)) {
                System.out.println("✅ Public path - bypassing JWT filter");
                return chain.filter(exchange);
            }
            
            System.out.println("🔒 Private path - checking JWT token");
            
            // ✅ Authorization 헤더 대신 쿠키에서 토큰 확인
            String token = getTokenFromCookie(request, "accessToken");
            System.out.println("🎫 Access Token from Cookie: " + (token != null ? "Present (length: " + token.length() + ")" : "Missing"));
            
            // ✅ 토큰이 없으면 Refresh Token으로 시도 (옵션)
            if (token == null) {
                String refreshToken = getTokenFromCookie(request, "refreshToken");
                System.out.println("🔄 Checking Refresh Token: " + (refreshToken != null ? "Present" : "Missing"));
                
                if (refreshToken != null && JwtUtil.validateToken(refreshToken)) {
                    System.out.println("🎯 Using Refresh Token for authentication");
                    token = refreshToken;
                } else {
                    System.out.println("❌ No valid token found in cookies - returning 401");
                    return handleUnauthorized(exchange);
                }
            }
            
            System.out.println("🔑 Token found, validating...");
            
            try {
                if (!JwtUtil.validateToken(token)) {
                    System.out.println("❌ Token validation failed");
                    return handleUnauthorized(exchange);
                }

                Long userId = JwtUtil.getUserIdFromToken(token);
                System.out.println("✅ Token valid for user: " + userId);
                
                // ✅ 기존 Authorization 헤더 제거하고 X-User-Id 헤더 추가
                ServerHttpRequest modifiedRequest = request.mutate()
                        .header("X-User-Id", userId.toString())
                        .build();

                return chain.filter(exchange.mutate().request(modifiedRequest).build());
                
            } catch (Exception e) {
                System.out.println("❌ JWT processing error: " + e.getMessage());
                e.printStackTrace();
                return handleUnauthorized(exchange);
            }
        };
    }
}