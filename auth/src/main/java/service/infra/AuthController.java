package service.infra;

import java.util.Optional;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import service.domain.*;
import service.dto.*;
import java.util.Map;
import java.util.HashMap;
import java.util.Date;
import service.common.JwtUtil;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
// import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.mindrot.jbcrypt.BCrypt;

//<<< Clean Arch / Inbound Adaptor

@RestController
@RequestMapping(value="/auths")
@Transactional
public class AuthController {

    @Autowired
    AuthRepository authRepository;

    @PatchMapping("/user/password-change")
    public ResponseEntity<String> changePassword(@RequestBody ChangePasswordRequest request,
                                            @RequestHeader("X-User-Id") Long userId) { // 수정된 부분
        
        Auth auth = authRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!BCrypt.checkpw(request.getCurrentPassword(), auth.getPasswordHash())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Current password incorrect");
        }

        auth.setPasswordHash(BCrypt.hashpw(request.getNewPassword(), BCrypt.gensalt()));
        authRepository.save(auth);

        return ResponseEntity.ok("Password changed successfully");
    }

    @PatchMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody ResetPasswordRequest request,
                                                @RequestHeader("X-User-Email") String token) {
        String email = JwtUtil.getEmailFromToken(token);
        String newPassword = request.getNewPassword();

        Auth auth = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 실제 서비스 로직에 위임
        auth.resetPassword(newPassword);

        // 비밀번호 재설정 후 토큰 초기화
        auth.invalidateTokens();                                                
        return ResponseEntity.ok("비밀번호가 재설정되었습니다.");
    }

    @PostMapping("/resend-code")
    public ResponseEntity<?> resendCode(@RequestBody ResendCodeRequest request) {
        String email = request.getEmail();
        
        Optional<Auth> authOpt = authRepository.findByEmail(email);
        if (authOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("이메일을 찾을 수 없습니다.");
        }
        
        Auth auth = authOpt.get();
        
        // 재발송 제한 확인
        if (!auth.canResendCode()) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body("잠시 후 다시 시도해주세요. (1분 후 재발송 가능)");
        }
        
        // 이벤트 기반으로 재발송 처리
        auth.resendEmailVerification();
        authRepository.save(auth);
        
        return ResponseEntity.ok("인증 코드가 재발송되었습니다.");
    }

    // 인증 코드 검증 (현재는 이메일 인증 생략)
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody VerifyCodeRequest request) {
        String email = request.getEmail();
        String code = request.getCode();
        
        System.out.println("인증 코드 검증 요청: " + email + " / " + code);
        
        // 이메일 인증 생략 - 모든 요청을 성공으로 처리
        System.out.println("이메일 인증 생략 모드 - 자동 성공 처리");
        return ResponseEntity.ok("인증 성공 (개발 모드)");
        
        /*
        // 원래 로직 (나중에 활성화)
        Optional<Auth> authOpt = authRepository.findByEmail(email);
        if (authOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("이메일 없음");
        }

        Auth auth = authOpt.get();
        boolean valid = auth.verifyCode(code);
        if (valid) {
            if ("PASSWORD_RESET".equals(auth.getPurpose())){
                String emailToken = JwtUtil.generateEmailToken(email);
                auth.setEmailToken(emailToken);
                return ResponseEntity.ok().header("X-Email-Token", emailToken).build();
            }
            return ResponseEntity.ok("인증 성공");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("인증에 실패했습니다. 코드를 확인해주세요.");
        }
        */
    }

    // 사용자 조회 테스트 엔드포인트
    @GetMapping("/check-user/{loginId}")
    public ResponseEntity<?> checkUser(@PathVariable String loginId) {
        try {
            Optional<Auth> authOpt = authRepository.findByLoginId(loginId);
            if (authOpt.isPresent()) {
                Auth auth = authOpt.get();
                return ResponseEntity.ok(Map.of(
                    "exists", true,
                    "loginId", auth.getLoginId(),
                    "email", auth.getEmail(),
                    "userId", auth.getUserId(),
                    "isVerified", auth.isVerified()
                ));
            } else {
                return ResponseEntity.ok(Map.of("exists", false));
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error checking user: " + e.getMessage());
        }
    }

    // 안전한 로그인 엔드포인트 - String/Object 모두 처리
    @PostMapping("/safe-login")
    public ResponseEntity<?> safeLogin(@RequestBody(required = false) Object rawData, 
                                      HttpServletRequest httpRequest) {
        System.out.println("=== 안전한 로그인 요청 ===");
        System.out.println("Raw Data Type: " + (rawData != null ? rawData.getClass().getName() : "null"));
        System.out.println("Raw Data: " + rawData);
        
        String loginId = null;
        String password = null;
        
        try {
            if (rawData instanceof Map) {
                Map<String, Object> mapData = (Map<String, Object>) rawData;
                loginId = (String) mapData.get("loginId");
                password = (String) mapData.get("password");
            } else if (rawData instanceof String) {
                System.out.println("문자열 데이터 수신, JSON 파싱 시도");
                // JSON 문자열인 경우 파싱
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> parsedData = mapper.readValue((String) rawData, Map.class);
                loginId = (String) parsedData.get("loginId");
                password = (String) parsedData.get("password");
            }
            
            System.out.println("Extracted LoginId: " + loginId);
            System.out.println("Extracted Password: " + (password != null ? "[PROVIDED]" : "[NULL]"));
            
            if (loginId == null || password == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("로그인 아이디와 비밀번호를 입력해주세요.");
            }
            
            // 실제 로그인 로직 수행
            Auth auth = authRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));
            
            if (!auth.isVerified()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("이메일 미인증 상태입니다.");
            }
            
            auth.verifyPassword(password);
            
            // 토큰 생성
            String accessToken = JwtUtil.generateToken(auth.getUserId());
            String refreshToken = JwtUtil.generateRefreshToken(auth.getUserId());
            
            auth.updateTokens(accessToken, refreshToken);
            authRepository.save(auth);
            
            return ResponseEntity.ok(Map.of(
                "accessToken", accessToken,
                "refreshToken", refreshToken,
                "userId", auth.getUserId(),
                "loginId", auth.getLoginId()
            ));
            
        } catch (Exception e) {
            System.err.println("로그인 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("로그인 실패: " + e.getMessage());
        }
    }

    // User 서비스에서 직접 호출하는 비밀번호 저장 API
    @PostMapping("/save-password")
    public ResponseEntity<?> savePassword(@RequestBody Object rawUserData) {
        try {
            System.out.println("비밀번호 저장 요청 수신: " + rawUserData);
            System.out.println("Data Type: " + (rawUserData != null ? rawUserData.getClass().getName() : "null"));
            
            Map<String, Object> userData = null;
            
            if (rawUserData instanceof Map) {
                userData = (Map<String, Object>) rawUserData;
            } else if (rawUserData instanceof String) {
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                userData = mapper.readValue((String) rawUserData, Map.class);
            } else {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("잘못된 데이터 형식입니다.");
            }
            
            // Auth 엔티티 생성
            Auth auth = new Auth();
            auth.setUserId(((Number) userData.get("userId")).longValue());
            auth.setLoginId((String) userData.get("loginId"));
            auth.setEmail((String) userData.get("email"));
            auth.setPasswordHash((String) userData.get("passwordHash"));
            auth.setVerified(true); // 이메일 인증 생략
            auth.setCreatedAt(new Date());
            
            authRepository.save(auth);
            System.out.println("Auth 엔티티 저장 완료. UserId: " + auth.getUserId());
            
            return ResponseEntity.ok("비밀번호 저장 완료");
            
        } catch (Exception e) {
            System.err.println("비밀번호 저장 중 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("비밀번호 저장 실패: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody(required = false) Object rawLoginData, 
                                  HttpServletRequest httpRequest) {
        System.out.println("=== 로그인 요청 시작 ===");
        System.out.println("Request URL: " + httpRequest.getRequestURL());
        System.out.println("Content Type: " + httpRequest.getContentType());
        System.out.println("Raw Data Type: " + (rawLoginData != null ? rawLoginData.getClass().getName() : "null"));
        System.out.println("Raw Login Data: " + rawLoginData);
        
        String loginId = null;
        String password = null;
        
        try {
            if (rawLoginData instanceof Map) {
                Map<String, Object> mapData = (Map<String, Object>) rawLoginData;
                loginId = (String) mapData.get("loginId");
                password = (String) mapData.get("password");
            } else if (rawLoginData instanceof String) {
                System.out.println("문자열 데이터 수신, JSON 파싱 시도");
                com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                Map<String, Object> parsedData = mapper.readValue((String) rawLoginData, Map.class);
                loginId = (String) parsedData.get("loginId");
                password = (String) parsedData.get("password");
            }
            
            if (rawLoginData == null) {
                System.out.println("ERROR: rawLoginData is null");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("로그인 데이터가 없습니다.");
            }
        
            System.out.println("Extracted LoginId: " + loginId);
            System.out.println("Extracted Password: " + (password != null ? "[PROVIDED]" : "[NULL]"));
            
            if (loginId == null || loginId.trim().isEmpty()) {
                System.out.println("ERROR: LoginId is empty");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("로그인 아이디를 입력해주세요.");
            }
            
            if (password == null || password.trim().isEmpty()) {
                System.out.println("ERROR: Password is empty");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("비밀번호를 입력해주세요.");
            }
            // 1. 사용자 조회
            System.out.println("사용자 조회 시작: " + loginId);
            Auth auth = authRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));
            
            System.out.println("사용자 찾음. UserId: " + auth.getUserId() + ", Verified: " + auth.isVerified());
            
            // 2. 이메일 인증 상태 확인
            if (!auth.isVerified()){
                System.out.println("이메일 미인증 상태");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인 실패 : 이메일 미인증 상태");
            }
            
            // 3. 비밀번호 검증
            System.out.println("비밀번호 검증 시작");
            auth.verifyPassword(password);
            System.out.println("비밀번호 검증 성공");
            
            // Access Token과 Refresh Token 생성
            String accessToken = JwtUtil.generateToken(auth.getUserId());
            String refreshToken = JwtUtil.generateRefreshToken(auth.getUserId());
            
            // 토큰 정보 저장
            auth.updateTokens(accessToken, refreshToken);
            authRepository.save(auth);

            // 로그인 성공 이벤트 발행 (Kafka 직렬화 오류로 임시 비활성화)
            // LoginSuccessed event = new LoginSuccessed(auth, accessToken);
            // event.publish();

            Map<String, String> tokens = new HashMap<>();
            tokens.put("accessToken", accessToken);
            tokens.put("refreshToken", refreshToken);
            tokens.put("tokenType", "Bearer");
            
            return ResponseEntity.ok(tokens);
            
        } catch (IllegalArgumentException e) {
            // 로그인 실패 이벤트 발행 해야하는데 auth를 
            // 못불러온거라 기능도 없으니 그냥 주석 처리
            // LoginFailed event = new LoginFailed(auth);
            // event.publish();
            System.err.println("로그인 실패: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인 실패: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("로그인 처리 중 오류: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("로그인 실패: " + e.getMessage());
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();
        
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Refresh Token이 필요합니다.");
        }
        
        try {
            // Refresh Token 유효성 검증
            if (!JwtUtil.validateToken(refreshToken)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("유효하지 않은 Refresh Token입니다.");
            }
            
            // Refresh Token에서 userId 추출
            Long userId = JwtUtil.getUserIdFromToken(refreshToken);
            
            // DB에서 해당 사용자의 Refresh Token 확인
            Auth auth = authRepository.findByUserId(userId)
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));
            
            // 저장된 Refresh Token과 비교
            if (!refreshToken.equals(auth.getRefreshToken())) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body("Refresh Token이 일치하지 않습니다.");
            }
            
            // 새로운 Access Token 생성
            String newAccessToken = JwtUtil.generateToken(userId);
            
            // 선택사항: 새로운 Refresh Token도 생성 (보안 강화)
            String newRefreshToken = JwtUtil.generateRefreshToken(userId);
            
            // 토큰 정보 업데이트
            auth.updateTokens(newAccessToken, newRefreshToken);
            authRepository.save(auth);
            
            Map<String, String> tokens = new HashMap<>();
            tokens.put("accessToken", newAccessToken);
            tokens.put("refreshToken", newRefreshToken);
            tokens.put("tokenType", "Bearer");
            
            return ResponseEntity.ok(tokens);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("토큰 갱신 실패: " + e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody LogoutRequest request) {
        String refreshToken = request.getRefreshToken();
        
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Refresh Token이 필요합니다.");
        }
        
        try {
            // Refresh Token에서 userId 추출 (만료되어도 추출은 가능)
            Long userId = JwtUtil.getUserIdFromToken(refreshToken);
            
            // DB에서 해당 사용자 찾기
            Optional<Auth> authOptional = authRepository.findByUserId(userId);
            
            if (authOptional.isPresent()) {
                Auth auth = authOptional.get();
                
                // 토큰 무효화
                auth.invalidateTokens();
                authRepository.save(auth);
                
                System.out.println("로그아웃 완료: userId = " + userId);
            }
            
            return ResponseEntity.ok("로그아웃이 완료되었습니다.");
            
        } catch (Exception e) {
            // 토큰이 만료되거나 잘못되어도 로그아웃은 성공으로 처리
            System.err.println("로그아웃 처리 중 오류: " + e.getMessage());
            return ResponseEntity.ok("로그아웃이 완료되었습니다.");
        }
    }

    // 모든 기기에서 로그아웃 (추가 기능)
    @PostMapping("/logout-all")
    public ResponseEntity<?> logoutAll(@RequestBody LogoutRequest request) {
        String refreshToken = request.getRefreshToken();
        
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Refresh Token이 필요합니다.");
        }
        
        try {
            Long userId = JwtUtil.getUserIdFromToken(refreshToken);
            
            // 해당 사용자의 모든 토큰 무효화
            Optional<Auth> authOptional = authRepository.findByUserId(userId);
            
            if (authOptional.isPresent()) {
                Auth auth = authOptional.get();
                auth.invalidateTokens();
                authRepository.save(auth);
                
                System.out.println("전체 로그아웃 완료: userId = " + userId);
            }
            
            return ResponseEntity.ok("모든 기기에서 로그아웃이 완료되었습니다.");
            
        } catch (Exception e) {
            System.err.println("전체 로그아웃 처리 중 오류: " + e.getMessage());
            return ResponseEntity.ok("로그아웃이 완료되었습니다.");
        }
    }
}
//>>> Clean Arch / Inbound Adaptor
