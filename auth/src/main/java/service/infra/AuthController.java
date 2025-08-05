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
                                                @RequestHeader("X-User-Email") String email) {
        // String email = request.getEmail();
        String newPassword = request.getNewPassword();

        Auth auth = authRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // 실제 서비스 로직에 위임
        auth.resetPassword(newPassword);

        return ResponseEntity.ok("비밀번호가 재설정되었습니다.");
    }

    // 인증 코드 검증
    @PostMapping("/verify-code")
    public ResponseEntity<?> verifyCode(@RequestBody VerifyCodeRequest request) {
        String email = request.getEmail();
        String code = request.getCode();
        

        Optional<Auth> authOpt = authRepository.findByEmail(email);
        if (authOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("이메일 없음");
        }

        Auth auth = authOpt.get();
        boolean valid = auth.verifyCode(code);
        if (valid) {
            if ("PASSWORD_RESET".equals(auth.getPurpose())){
                String emailToken = JwtUtil.generateEmailToken(email);
                return ResponseEntity.ok().header("X-Email-Token", emailToken).build();
            }
            return ResponseEntity.ok("인증 성공");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("인증 실패 또는 만료");
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginCommand command) {
        try {
            Auth auth = authRepository.findByLoginId(command.getLoginId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));

            auth.verifyPassword(command.getPassword());
            
            // Access Token과 Refresh Token 생성
            String accessToken = JwtUtil.generateToken(auth.getUserId());
            String refreshToken = JwtUtil.generateRefreshToken(auth.getUserId());
            
            // 토큰 정보 저장
            auth.updateTokens(accessToken, refreshToken);
            authRepository.save(auth);

            // 로그인 성공 이벤트 발행
            LoginSuccessed event = new LoginSuccessed(auth, accessToken);
            event.publish();

            Map<String, String> tokens = new HashMap<>();
            tokens.put("accessToken", accessToken);
            tokens.put("refreshToken", refreshToken);
            tokens.put("tokenType", "Bearer");
            
            return ResponseEntity.ok(tokens);
        } catch (IllegalArgumentException e) {
            // 로그인 실패 이벤트 발행
            LoginFailed event = new LoginFailed(auth);
            event.publish();

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인 실패: " + e.getMessage());
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
