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

    @Override
    public GatewayFilter apply(Config config) {
        return (exchange, chain) -> {
            ServerHttpRequest request = exchange.getRequest();
            
            // 인증이 필요 없는 경로들
            String path = request.getURI().getPath();
            if (isPublicPath(path)) {
                return chain.filter(exchange);
            }

            // Authorization 헤더 확인
            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
            
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return handleUnauthorized(exchange);
            }

            String token = authHeader.substring(7);
            
            try {
                // 토큰 유효성 검증
                if (!JwtUtil.validateToken(token)) {
                    return handleUnauthorized(exchange);
                }

                // 토큰에서 userId 추출
                Long userId = JwtUtil.getUserIdFromToken(token);
                
                // 헤더에 userId 추가 (백엔드 서비스에서 사용)
                ServerHttpRequest modifiedRequest = request.mutate()
                        .header("X-User-Id", userId.toString())
                        .build();

                return chain.filter(exchange.mutate().request(modifiedRequest).build());
                
            } catch (Exception e) {
                return handleUnauthorized(exchange);
            }
        };
    }

    private boolean isPublicPath(String path) {
        return path.startsWith("/auths/login") ||
               path.startsWith("/auths/refresh") ||
               path.startsWith("/auths/verify-code") ||
               path.startsWith("/auths/reset-password") ||
               path.startsWith("/users/register") ||
               path.startsWith("/users/check-email") ||
               path.startsWith("/users/find-id") ||
               path.equals("/") ||
               path.startsWith("/static/") ||
               path.startsWith("/css/") ||
               path.startsWith("/js/") ||
               path.startsWith("/images/");
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
}