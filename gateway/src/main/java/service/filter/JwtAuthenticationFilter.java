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

    private boolean isIframeOnlyPath(String path) {
        return path.startsWith("/webtoon/") ||
               path.startsWith("/webtoon-hl/") ||
               path.startsWith("/goods-gen/") ||
               path.startsWith("/ppl-gen/") ||
               path.startsWith("/ppl-gen") ||
               path.startsWith("/question/");
    }

    private boolean isValidIframeRequest(ServerHttpRequest request) {
        String referer = request.getHeaders().getFirst("Referer");
        String path = request.getURI().getPath();
        
        System.out.println("🔍 Referer: " + referer);
        
        if (referer != null) {
            // 정적 파일인 경우 (확장자가 있는 경우)
            if (path.contains(".")) {
                // 정적 파일은 같은 서브 프론트에서 오는 것도 허용
                // 예: /ppl-gen/static/js/main.js 의 referer가 /ppl-gen/ 인 경우 허용
                String currentService = getCurrentService(path);
                String refererService = getCurrentService(referer);
                
                System.out.println("🔍 Current service: " + currentService);
                System.out.println("🔍 Referer service: " + refererService);
                
                if (currentService != null && currentService.equals(refererService)) {
                    System.out.println("✅ Static file from same service - allowed");
                    return true;
                }
            }
            
            // HTML 파일은 메인 페이지에서만 허용
            return !referer.contains("/webtoon/") && 
                   !referer.contains("/webtoon-hl/") && 
                   !referer.contains("/goods-gen/") && 
                   !referer.contains("/ppl-gen/") && 
                   !referer.contains("/question/");
        }
        
        return false;
    }

    private String getCurrentService(String pathOrUrl) {
        // URL인 경우 경로 부분만 추출
        String path = pathOrUrl;
        if (pathOrUrl.startsWith("http")) {
            try {
                path = pathOrUrl.substring(pathOrUrl.indexOf('/', 8)); // http://domain/ 이후 부분
            } catch (Exception e) {
                return null;
            }
        }
        
        if (path.startsWith("/webtoon-hl/")) return "webtoon-hl";
        if (path.startsWith("/webtoon/")) return "webtoon";
        if (path.startsWith("/goods-gen/")) return "goods-gen";
        if (path.startsWith("/ppl-gen/")) return "ppl-gen";
        if (path.startsWith("/question/")) return "question";
        return null;
    }

    private boolean isPublicPath(String path) {
        if (path.equals("/") || path.isEmpty()) {
            return true;
        }

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

        if (path.startsWith("/board/")) {
            return true;
        }

        if (path.startsWith("/@") ||
            path.startsWith("/src/") ||
            path.startsWith("/node_modules/") ||
            path.contains("vite")) {
            return true;
        }

        if (path.contains(".")) {
            // 서브 프론트의 정적 파일은 iframe 체크를 통과시키고, 메인 프론트는 바로 허용
            if (isIframeOnlyPath(path)) {
                System.out.println("📁 Sub-frontend static file - will be handled by iframe check: " + path);
                return false; // iframe 체크를 거치도록
            }
            System.out.println("📁 Main frontend static file - public access: " + path);
            return true;
        }

        if (path.equals("/login") ||
            path.equals("/register") ||
            path.equals("/email-verification") ||
            path.equals("/find-id") ||
            path.equals("/find-password") ||
            path.equals("/main") ||
            path.equals("/notice-board") ||
            path.equals("/faq")) {
            return true;
        }

        return false;
    }

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

    private Mono<Void> handleBlockedAccess(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        ServerHttpRequest request = exchange.getRequest();

        String acceptHeader = request.getHeaders().getFirst("Accept");
        if (acceptHeader != null && acceptHeader.contains("text/html")) {
            response.setStatusCode(HttpStatus.FORBIDDEN);
            response.getHeaders().add("Content-Type", "text/html; charset=UTF-8");

            String htmlBody = 
                "<!DOCTYPE html>" +
                "<html lang=\"ko\">" +
                "<head>" +
                    "<meta charset=\"UTF-8\">" +
                    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                    "<title>접근 차단</title>" +
                    "<style>" +
                        "body {" +
                            "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" +
                            "margin: 0;" +
                            "padding: 0;" +
                            "background: linear-gradient(135deg, rgb(239, 68, 68) 0%, rgb(185, 28, 28) 100%);" +
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
                            "color: #ef4444;" +
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
                            "background: #ef4444;" +
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
                        "<div class=\"icon\">🚫</div>" +
                        "<h1>직접 접근이 차단되었습니다</h1>" +
                        "<p>이 서비스는 메인 페이지를 통해서만<br>" +
                        "이용하실 수 있습니다.</p>" +
                        "<a href=\"/\" class=\"btn\">메인 페이지로 이동</a>" +
                    "</div>" +
                "</body>" +
                "</html>";
            DataBuffer buffer = response.bufferFactory().wrap(htmlBody.getBytes(StandardCharsets.UTF_8));
            return response.writeWith(Mono.just(buffer));
        }

        response.setStatusCode(HttpStatus.FORBIDDEN);
        String body = "{\"error\":\"Forbidden\",\"message\":\"직접 접근이 차단된 서비스입니다.\"}";
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        response.getHeaders().add("Content-Type", "application/json");

        return response.writeWith(Mono.just(buffer));
    }

    private Mono<Void> handleUnauthorized(ServerWebExchange exchange) {
        ServerHttpResponse response = exchange.getResponse();
        ServerHttpRequest request = exchange.getRequest();

        String acceptHeader = request.getHeaders().getFirst("Accept");
        if (acceptHeader != null && acceptHeader.contains("text/html")) {
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            response.getHeaders().add("Content-Type", "text/html; charset=UTF-8");

            String htmlBody = 
                "<!DOCTYPE html>" +
                "<html lang=\"ko\">" +
                "<head>" +
                    "<meta charset=\"UTF-8\">" +
                    "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">" +
                    "<title>로그인 필요</title>" +
                    "<style>" +
                        "body {" +
                            "font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;" +
                            "margin: 0;" +
                            "padding: 0;" +
                            "background: linear-gradient(135deg, rgb(129, 219, 162) 0%, rgb(34, 197, 94) 100%);" +
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
                            "color: #f39c12;" +
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
                            "background: #22c55e;" +
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
                        "<div class=\"icon\">🔐</div>" +
                        "<h1>로그인 후 이용 가능합니다</h1>" +
                        "<p>이 서비스는 회원 전용 서비스입니다.<br>" +
                        "로그인을 하시면 모든 기능을 이용하실 수 있습니다.</p>" +
                        "<a href=\"/login\" class=\"btn\">로그인 하기</a>" +
                    "</div>" +
                "</body>" +
                "</html>";
            DataBuffer buffer = response.bufferFactory().wrap(htmlBody.getBytes(StandardCharsets.UTF_8));
            return response.writeWith(Mono.just(buffer));
        }

        response.setStatusCode(HttpStatus.UNAUTHORIZED);
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

            System.out.println("=== JWT Filter Debug ===");
            System.out.println("📍 Request Path: " + path);
            System.out.println("🔧 Request Method: " + method);
            System.out.println("🔍 Is Public Path: " + isPublicPath(path));
            System.out.println("🚫 Is Iframe Only Path: " + isIframeOnlyPath(path));
            System.out.println("📁 Contains dot (static file): " + path.contains("."));

            // iframe 전용 경로인지 확인 (정적 파일 체크보다 먼저)
            if (isIframeOnlyPath(path)) {
                if (!isValidIframeRequest(request)) {
                    System.out.println("🚫 Direct access to iframe-only path blocked: " + path);
                    return handleBlockedAccess(exchange);
                }
                System.out.println("✅ Valid iframe request detected for: " + path);
                // iframe 요청이 유효하면 바로 다음 단계로 진행 (JWT 체크 없이)
                return chain.filter(exchange);
            }

            if (isPublicPath(path)) {
                System.out.println("✅ Public path - bypassing JWT filter");
                return chain.filter(exchange);
            }

            System.out.println("🔒 Private path - checking JWT token");

            String token = getTokenFromCookie(request, "accessToken");
            System.out.println("🎫 Access Token from Cookie: " + (token != null ? "Present (length: " + token.length() + ")" : "Missing"));

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