package service.filter;

import service.common.JwtUtil;
import org.springframework.cloud.gateway.filter.GatewayFilter;
import org.springframework.cloud.gateway.filter.factory.AbstractGatewayFilterFactory;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import java.nio.charset.StandardCharsets;

@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    public JwtAuthenticationFilter() {
        super(Config.class);
    }

    // @Override
    // public GatewayFilter apply(Config config) {
    //     return (exchange, chain) -> {
    //         ServerHttpRequest request = exchange.getRequest();
            
    //         // 인증이 필요 없는 경로들
    //         String path = request.getURI().getPath();
    //         if (isPublicPath(path)) {
    //             return chain.filter(exchange);
    //         }

    //         // Authorization 헤더 확인
    //         String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            
    //         if (authHeader == null || !authHeader.startsWith("Bearer ")) {
    //             return handleUnauthorized(exchange);
    //         }

    //         String token = authHeader.substring(7);
            
    //         try {
    //             // 토큰 유효성 검증
    //             if (!JwtUtil.validateToken(token)) {
    //                 return handleUnauthorized(exchange);
    //             }

    //             // 토큰에서 userId 추출
    //             Long userId = JwtUtil.getUserIdFromToken(token);
                
    //             // 헤더에 userId 추가 (백엔드 서비스에서 사용)
    //             ServerHttpRequest modifiedRequest = request.mutate()
    //                     .header("X-User-Id", userId.toString())
    //                     .build();

    //             return chain.filter(exchange.mutate().request(modifiedRequest).build());
                
    //         } catch (Exception e) {
    //             return handleUnauthorized(exchange);
    //         }
    //     };
    // }

    // private boolean isPublicPath(String path) {
    //     return path.startsWith("/auths/login") ||
    //            path.startsWith("/auths/refresh") ||
    //            path.startsWith("/auths/verify-code") ||
    //            path.startsWith("/auths/reset-password") ||
    //            path.startsWith("/users/register") ||
    //            path.startsWith("/users/check-email") ||
    //            path.startsWith("/users/find-id") ||
    //            path.equals("/") ||
    //            path.startsWith("/static/") ||
    //            path.startsWith("/css/") ||
    //            path.startsWith("/js/") ||
    //            path.startsWith("/images/");
    // }

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
            path.equals("/find-password")) {
            return true;
        }
        
        return false;
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
            
            // Authorization 헤더 확인
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            System.out.println("🎫 Auth Header: " + (authHeader != null ? "Present" : "Missing"));
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                System.out.println("❌ No valid auth header - returning 401");
                return handleUnauthorized(exchange);
            }

            String token = authHeader.substring(7);
            System.out.println("🔑 Token extracted, length: " + token.length());
            
            try {
                if (!JwtUtil.validateToken(token)) {
                    System.out.println("❌ Token validation failed");
                    return handleUnauthorized(exchange);
                }

                Long userId = JwtUtil.getUserIdFromToken(token);
                System.out.println("✅ Token valid for user: " + userId);
                
                ServerHttpRequest modifiedRequest = request.mutate()
                        .header("X-User-Id", userId.toString())
                        .build();

                return chain.filter(exchange.mutate().request(modifiedRequest).build());
                
            } catch (Exception e) {
                System.out.println("❌ JWT processing error: " + e.getMessage());
                return handleUnauthorized(exchange);
            }
        };
    }
}