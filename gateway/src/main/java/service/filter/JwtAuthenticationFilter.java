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

    private boolean isProtectedServicePath(String path) {
        // 🔒 보호해야 하는 서브 프론트엔드 서비스들
        return path.startsWith("/webtoon/") ||          // 웹툰 대시보드
               path.startsWith("/webtoon-hl/") ||       // 하이라이트 제작
               path.startsWith("/goods-gen/") ||        // 굿즈 생성기
               path.startsWith("/ppl-gen/") ||          // 광고(PPL) 생성기
               path.startsWith("/question/");           // AI 챗봇
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
        
        // 🆕 자유게시판은 공개
        if (path.startsWith("/board/")) {
            return true;
        }
        
        // Vite 개발 서버 전용 경로들
        if (path.startsWith("/@") ||
            path.startsWith("/src/") ||
            path.startsWith("/node_modules/") ||
            path.contains("vite")) {
            return true;
        }
        
        // 🎯 중요한 수정: 보호된 서비스의 정적 파일도 인증 체크
        if (isProtectedServicePath(path)) {
            System.out.println("🔒 Protected service path detected: " + path + " - JWT required");
            return false; // 인증 필요
        }
        
        // 메인 프론트엔드의 정적 파일만 공개 (확장자 기반)
        if (path.contains(".")) {
            System.out.println("📁 Static file in main frontend: " + path + " - public access");
            return true;
        }
        
        // React 라우트 (메인 프론트엔드)
        if (path.equals("/login") ||
            path.equals("/register") ||
            path.equals("/email-verification") ||
            path.equals("/find-id") ||
            path.equals("/find-password") ||
            path.equals("/main") ||
            path.equals("/notice-board") ||  // 공지사항
            path.equals("/faq")) {           // FAQ
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
        String body = "{\"error\":\"Unauthorized\",\"message\":\"로그인이 필요한 서비스입니다.\"}";
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
            System.out.println("🔒 Is Protected Service: " + isProtectedServicePath(path));
            
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