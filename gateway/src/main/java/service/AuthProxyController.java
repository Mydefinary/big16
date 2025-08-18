package service;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.util.Map;
import java.time.Duration;

@RestController
@RequestMapping("/api/auths")
public class AuthProxyController {

    @Autowired
    private RestTemplate restTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/login")
    public Mono<ResponseEntity<?>> proxyLogin(@RequestBody Map<String, Object> request, ServerWebExchange exchange) {
        return Mono.fromCallable(() -> {
            try {
                HttpHeaders headers = new HttpHeaders();
                headers.setContentType(MediaType.APPLICATION_JSON);
                
                HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
                
                // Auth 서비스로 로그인 요청 전달
                String[] urls = {
                    "http://auth-backend-service-hoa.default.svc.cluster.local:8080/auths/login",
                    "http://auth-backend-service-hoa:8080/auths/login"
                };
                
                for (String url : urls) {
                    try {
                        ResponseEntity<String> response = restTemplate.exchange(
                            url, HttpMethod.POST, entity, String.class
                        );
                        
                        if (response.getStatusCode() == HttpStatus.OK) {
                            // 로그인 성공 시 JWT를 쿠키로 설정
                            JsonNode responseBody = objectMapper.readTree(response.getBody());
                            
                            if (responseBody.has("accessToken")) {
                                String accessToken = responseBody.get("accessToken").asText();
                                String refreshToken = responseBody.has("refreshToken") ? 
                                    responseBody.get("refreshToken").asText() : null;
                                
                                // HttpOnly 쿠키 설정
                                ResponseCookie accessCookie = ResponseCookie.from("accessToken", accessToken)
                                    .httpOnly(true)
                                    .secure(false) // HTTPS 환경에서는 true로 설정
                                    .sameSite("Lax")
                                    .path("/")
                                    .maxAge(Duration.ofHours(1)) // 1시간
                                    .build();
                                
                                exchange.getResponse().getCookies().add("accessToken", accessCookie);
                                
                                if (refreshToken != null) {
                                    ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", refreshToken)
                                        .httpOnly(true)
                                        .secure(false)
                                        .sameSite("Lax")
                                        .path("/")
                                        .maxAge(Duration.ofDays(7)) // 7일
                                        .build();
                                    
                                    exchange.getResponse().getCookies().add("refreshToken", refreshCookie);
                                }
                                
                                // 프론트엔드에는 토큰 없이 성공 응답만 반환
                                return ResponseEntity.ok(Map.of(
                                    "success", true,
                                    "message", "로그인 성공"
                                ));
                            }
                        }
                        
                        return ResponseEntity.status(response.getStatusCode())
                            .body(response.getBody());
                            
                    } catch (Exception e) {
                        continue;
                    }
                }
                
                return ResponseEntity.status(503)
                    .body(Map.of("error", "인증 서비스 연결 실패"));
                    
            } catch (Exception e) {
                return ResponseEntity.status(500)
                    .body(Map.of("error", "로그인 처리 중 오류 발생: " + e.getMessage()));
            }
        });
    }

    @PostMapping("/logout")
    public Mono<ResponseEntity<?>> proxyLogout(ServerWebExchange exchange) {
        return Mono.fromCallable(() -> {
            try {
                // 쿠키 삭제
                ResponseCookie accessCookie = ResponseCookie.from("accessToken", "")
                    .httpOnly(true)
                    .secure(false)
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(Duration.ZERO)
                    .build();
                
                ResponseCookie refreshCookie = ResponseCookie.from("refreshToken", "")
                    .httpOnly(true)
                    .secure(false)
                    .sameSite("Lax")
                    .path("/")
                    .maxAge(Duration.ZERO)
                    .build();
                
                exchange.getResponse().getCookies().add("accessToken", accessCookie);
                exchange.getResponse().getCookies().add("refreshToken", refreshCookie);
                
                return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "로그아웃 성공"
                ));
                
            } catch (Exception e) {
                return ResponseEntity.status(500)
                    .body(Map.of("error", "로그아웃 처리 중 오류 발생: " + e.getMessage()));
            }
        });
    }

    @GetMapping("/check")
    public Mono<ResponseEntity<?>> checkAuth(ServerWebExchange exchange) {
        return Mono.fromCallable(() -> {
            try {
                String accessToken = null;
                
                // 쿠키에서 토큰 추출
                if (exchange.getRequest().getCookies().containsKey("accessToken")) {
                    accessToken = exchange.getRequest().getCookies().getFirst("accessToken").getValue();
                }
                
                if (accessToken != null && !accessToken.isEmpty()) {
                    return ResponseEntity.ok(Map.of(
                        "authenticated", true,
                        "message", "인증된 사용자"
                    ));
                } else {
                    return ResponseEntity.status(401)
                        .body(Map.of("authenticated", false, "message", "인증 필요"));
                }
                
            } catch (Exception e) {
                return ResponseEntity.status(500)
                    .body(Map.of("error", "인증 확인 중 오류 발생: " + e.getMessage()));
            }
        });
    }
}