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
import java.util.List; // List import 추가

@Component
public class JwtAuthenticationFilter extends AbstractGatewayFilterFactory<JwtAuthenticationFilter.Config> {

    public JwtAuthenticationFilter() {
        super(Config.class);
    }

    // ✅ [수정] isPublicPath 메소드를 최신화하고, 경로 목록을 List로 관리하여 가독성을 높입니다.
    private boolean isPublicPath(String path) {
        // 인증 없이 접근 가능한 API 경로 목록
        List<String> publicApiPaths = List.of(
                "/api/auth/login",
                "/api/auth/refresh",
                "/api/auth/verify-code",
                "/api/auth/reset-password",
                "/api/auth/resend-code",
                "/api/users/register",
                "/api/users/check-email",
                "/api/users/find-id"
        );

        return publicApiPaths.stream().anyMatch(p -> path.startsWith(p));
    }

    private Mono<Void> handleUnauthorized(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);

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

            if (isPublicPath(path)) {
                return chain.filter(exchange);
            }

            String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return handleUnauthorized(exchange);
            }

            String token = authHeader.substring(7);

            try {
                if (!JwtUtil.validateToken(token)) {
                    return handleUnauthorized(exchange);
                }

                Long userId = JwtUtil.getUserIdFromToken(token);

                ServerHttpRequest modifiedRequest = request.mutate()
                        .header("X-User-Id", userId.toString())
                        .build();

                return chain.filter(exchange.mutate().request(modifiedRequest).build());

            } catch (Exception e) {
                return handleUnauthorized(exchange);
            }
        };
    }
}
