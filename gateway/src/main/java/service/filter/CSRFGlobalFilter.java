package service.filter;

import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Component
public class CSRFGlobalFilter implements GlobalFilter, Ordered {

    private boolean isPublicPath(String path) {
        // 공개 경로는 CSRF 체크하지 않음
        return path.startsWith("/auths/login") ||
               path.startsWith("/auths/refresh") ||
               path.startsWith("/auths/verify-code") ||
               path.startsWith("/auths/reset-password") ||
               path.startsWith("/auths/resend-code") ||
               path.startsWith("/users/register") ||
               path.startsWith("/users/check-email") ||
               path.startsWith("/users/find-id") ||
               path.startsWith("/board/") ||
               path.contains(".") || // 정적 파일
               path.equals("/") ||
               path.isEmpty();
    }

    private boolean requiresCSRFCheck(String method) {
        return "POST".equals(method) || 
               "PUT".equals(method) || 
               "PATCH".equals(method) || 
               "DELETE".equals(method);
    }

    private Mono<Void> handleCSRFError(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        ServerHttpRequest request = exchange.getRequest();

        String acceptHeader = request.getHeaders().getFirst("Accept");
        
        // HTML 요청인 경우
        if (acceptHeader != null && acceptHeader.contains("text/html")) {
            response.setStatusCode(HttpStatus.FORBIDDEN);
            response.getHeaders().add("Content-Type", "text/html; charset=UTF-8");

            String htmlBody = 
                "<!DOCTYPE html>" +
                "<html lang=\"ko\">" +
                "<head>" +
                    "<meta charset=\"UTF-8\">" +
                    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                    "<title>보안 오류</title>" +
                    "<style>" +
                        "body {" +
                            "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" +
                            "margin: 0;" +
                            "padding: 0;" +
                            "background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);" +
                            "display: flex;" +
                            "justify-content: center;" +
                            "align-items: center;" +
                            "min-height: 100vh;" +
                        "}" +
                        ".container {" +
                            "background: white;" +
                            "padding: 40px;" +
                            "border-radius: 10px;" +
                            "box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);" +
                            "text-align: center;" +
                            "max-width: 400px;" +
                            "width: 90%;" +
                        "}" +
                        ".icon {" +
                            "font-size: 48px;" +
                            "margin-bottom: 20px;" +
                            "color: #e74c3c;" +
                        "}" +
                        "h1 {" +
                            "color: #2c3e50;" +
                            "margin-bottom: 10px;" +
                            "font-size: 24px;" +
                        "}" +
                        "p {" +
                            "color: #7f8c8d;" +
                            "margin-bottom: 30px;" +
                            "line-height: 1.6;" +
                        "}" +
                        ".btn {" +
                            "background: #3498db;" +
                            "color: white;" +
                            "padding: 12px 30px;" +
                            "border: none;" +
                            "border-radius: 25px;" +
                            "font-size: 16px;" +
                            "cursor: pointer;" +
                            "text-decoration: none;" +
                            "display: inline-block;" +
                            "transition: transform 0.3s ease;" +
                        "}" +
                        ".btn:hover {" +
                            "transform: translateY(-2px);" +
                        "}" +
                    "</style>" +
                "</head>" +
                "<body>" +
                    "<div class=\"container\">" +
                        "<div class=\"icon\">🛡️</div>" +
                        "<h1>보안 토큰이 필요합니다</h1>" +
                        "<p>요청에 보안 토큰(CSRF)이 포함되지 않았습니다.<br>" +
                        "페이지를 새로고침하여 다시 시도해주세요.</p>" +
                        "<a href=\"javascript:location.reload()\" class=\"btn\">새로고침</a>" +
                    "</div>" +
                "</body>" +
                "</html>";
            
            DataBuffer buffer = response.bufferFactory().wrap(htmlBody.getBytes(StandardCharsets.UTF_8));
            return response.writeWith(Mono.just(buffer));
        }

        // JSON API 요청인 경우
        response.setStatusCode(HttpStatus.FORBIDDEN);
        response.getHeaders().add("Content-Type", "application/json");
        
        String jsonBody = "{\"error\":\"CSRF_TOKEN_MISSING\",\"message\":\"CSRF 토큰이 필요합니다.\"}";
        DataBuffer buffer = response.bufferFactory().wrap(jsonBody.getBytes(StandardCharsets.UTF_8));
        
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getURI().getPath();
        String method = request.getMethod().toString();

        System.out.println("=== CSRF Filter Debug ===");
        System.out.println("📍 Request Path: " + path);
        System.out.println("🔧 Request Method: " + method);
        System.out.println("🔍 Is Public Path: " + isPublicPath(path));
        System.out.println("🔒 Requires CSRF Check: " + requiresCSRFCheck(method));

        // 공개 경로이거나 CSRF 체크가 불필요한 메서드면 통과
        if (isPublicPath(path) || !requiresCSRFCheck(method)) {
            System.out.println("✅ CSRF check skipped");
            return chain.filter(exchange);
        }

        // CSRF 토큰 확인
        String csrfToken = request.getHeaders().getFirst("X-CSRF-Token");
        System.out.println("🎫 CSRF Token: " + (csrfToken != null ? "Present (length: " + csrfToken.length() + ")" : "Missing"));

        // 토큰이 없거나 너무 짧으면 차단
        if (csrfToken == null || csrfToken.length() < 32) {
            System.out.println("❌ CSRF token validation failed");
            return handleCSRFError(exchange);
        }

        System.out.println("✅ CSRF token validation passed");
        return chain.filter(exchange);
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE; // JWT 필터보다 먼저 실행
    }
}