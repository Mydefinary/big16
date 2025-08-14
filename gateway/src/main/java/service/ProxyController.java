package service;

import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import java.util.Map;

@RestController
@RequestMapping("/proxy")
public class ProxyController {

    @Autowired
    private RestTemplate restTemplate;

    @PostMapping("/users/register")
    public ResponseEntity<?> proxyUserRegister(@RequestBody Map<String, Object> request) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            // 다양한 URL 시도
            String[] urls = {
                "http://user-backend-service-hoa.default.svc.cluster.local:8081/users/register",
                "http://user-backend-service-hoa:8081/users/register",
                "http://localhost:8081/users/register"
            };
            
            for (String url : urls) {
                try {
                    ResponseEntity<String> response = restTemplate.exchange(
                        url, HttpMethod.POST, entity, String.class
                    );
                    return ResponseEntity.status(response.getStatusCode())
                        .body(Map.of("success", true, "data", response.getBody(), "url", url));
                } catch (Exception e) {
                    // 다음 URL 시도
                    continue;
                }
            }
            
            return ResponseEntity.status(503)
                .body(Map.of("error", "모든 user 서비스 URL 연결 실패", "urls", urls));
                
        } catch (Exception e) {
            return ResponseEntity.status(500)
                .body(Map.of("error", "프록시 처리 중 오류 발생: " + e.getMessage()));
        }
    }
}