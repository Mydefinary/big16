package service;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import java.util.HashMap;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", System.currentTimeMillis());
        response.put("service", "gateway");
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check-services")
    public ResponseEntity<Map<String, Object>> checkServices() {
        Map<String, Object> response = new HashMap<>();
        RestTemplate restTemplate = new RestTemplate();
        
        // User 서비스 체크
        try {
            ResponseEntity<String> userResponse = restTemplate.getForEntity(
                "http://user-backend-service-hoa.default.svc.cluster.local:8081/actuator/health", 
                String.class
            );
            response.put("user-service", "UP - " + userResponse.getStatusCode());
        } catch (Exception e) {
            response.put("user-service", "DOWN - " + e.getMessage());
        }
        
        // Auth 서비스 체크
        try {
            ResponseEntity<String> authResponse = restTemplate.getForEntity(
                "http://auth-backend-service-hoa.default.svc.cluster.local:8080/actuator/health", 
                String.class
            );
            response.put("auth-service", "UP - " + authResponse.getStatusCode());
        } catch (Exception e) {
            response.put("auth-service", "DOWN - " + e.getMessage());
        }
        
        return ResponseEntity.ok(response);
    }
}