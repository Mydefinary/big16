package service.infra;

import java.util.Optional;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.Cookie;
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
        auth.setEmailToken(null);

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
            // 비밀번호 재설정 일때
            if ("PASSWORD_RESET".equals(auth.getPurpose())){
                String emailToken = JwtUtil.generateEmailToken(email);
                auth.setEmailToken(emailToken);
                return ResponseEntity.ok().header("X-Email-Token", emailToken).build();
            }
            // 아이디 찾기 일때
            return ResponseEntity.ok("인증 성공");
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("인증에 실패했습니다. 코드를 확인해주세요.");
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        try {
            // ✅ 쿠키에서 Refresh Token 가져오기
            String refreshToken = getTokenFromCookie(request, "refreshToken");
            
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Refresh Token이 필요합니다.");
            }
            
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
            
            // ✅ 새로운 토큰들을 쿠키로 설정
            Cookie accessTokenCookie = new Cookie("accessToken", newAccessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(false); // 개발환경: false, 프로덕션: true
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(3600); // 1시간
                
            Cookie refreshTokenCookie = new Cookie("refreshToken", newRefreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(false); // 개발환경: false, 프로덕션: true
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(604800); // 7일
                
            // 쿠키 추가
            response.addCookie(accessTokenCookie);
            response.addCookie(refreshTokenCookie);
            
            // ✅ 프론트엔드에는 성공 메시지만 반환
            Map<String, String> responseBody = new HashMap<>();
            responseBody.put("message", "토큰 갱신 성공");
            responseBody.put("tokenType", "Bearer");
            
            return ResponseEntity.ok(responseBody);
            
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("토큰 갱신 실패: " + e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginCommand command, HttpServletResponse response) {
        try {
            Auth auth = authRepository.findByLoginId(command.getLoginId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 아이디입니다."));
            
            if (!auth.isVerified()){
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인 실패 : 이메일 미인증 상태");
            }
            auth.verifyPassword(command.getPassword());
            
            // Access Token과 Refresh Token 생성
            String accessToken = JwtUtil.generateToken(auth.getUserId());
            String refreshToken = JwtUtil.generateRefreshToken(auth.getUserId());
            
            // 토큰 정보 저장
            auth.updateTokens(accessToken, refreshToken);
            authRepository.save(auth);

            // ✅ MVC에서 Cookie 객체 사용
            Cookie accessTokenCookie = new Cookie("accessToken", accessToken);
            accessTokenCookie.setHttpOnly(true);
            accessTokenCookie.setSecure(false); // 개발환경: false, 프로덕션: true
            accessTokenCookie.setPath("/");
            accessTokenCookie.setMaxAge(3600); // 1시간 (초 단위)
                
            Cookie refreshTokenCookie = new Cookie("refreshToken", refreshToken);
            refreshTokenCookie.setHttpOnly(true);
            refreshTokenCookie.setSecure(false); // 개발환경: false, 프로덕션: true
            refreshTokenCookie.setPath("/");
            refreshTokenCookie.setMaxAge(604800); // 7일 (초 단위)
                
            // 쿠키 추가
            response.addCookie(accessTokenCookie);
            response.addCookie(refreshTokenCookie);

            // 로그인 성공 이벤트 발행
            LoginSuccessed event = new LoginSuccessed(auth, accessToken);
            event.publish();

            // ✅ 프론트엔드에는 성공 메시지만 반환 (토큰은 쿠키로 자동 저장됨)
            Map<String, String> response_body = new HashMap<>();
            response_body.put("message", "로그인 성공");
            response_body.put("tokenType", "Bearer");
            
            return ResponseEntity.ok(response_body);
        } catch (IllegalArgumentException e) {
            // 로그인 실패 이벤트 발행 해야하는데 auth를 
            // 못불러온거라 기능도 없으니 그냥 주석 처리
            // LoginFailed event = new LoginFailed(auth);
            // event.publish();

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("로그인 실패: " + e.getMessage());
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            // ✅ 쿠키에서 Refresh Token 가져오기
            String refreshToken = getTokenFromCookie(request, "refreshToken");
            
            if (refreshToken == null || refreshToken.isEmpty()) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body("Refresh Token이 필요합니다.");
            }
            
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
            
            // ✅ MVC에서 쿠키 삭제
            Cookie deleteAccessToken = new Cookie("accessToken", "");
            deleteAccessToken.setHttpOnly(true);
            deleteAccessToken.setSecure(false);
            deleteAccessToken.setPath("/");
            deleteAccessToken.setMaxAge(0); // 즉시 만료
                
            Cookie deleteRefreshToken = new Cookie("refreshToken", "");
            deleteRefreshToken.setHttpOnly(true);
            deleteRefreshToken.setSecure(false);
            deleteRefreshToken.setPath("/");
            deleteRefreshToken.setMaxAge(0); // 즉시 만료
                
            // 쿠키 삭제
            response.addCookie(deleteAccessToken);
            response.addCookie(deleteRefreshToken);
            
            return ResponseEntity.ok("로그아웃이 완료되었습니다.");
            
        } catch (Exception e) {
            // 토큰이 만료되거나 잘못되어도 로그아웃은 성공으로 처리하고 쿠키는 삭제
            System.err.println("로그아웃 처리 중 오류: " + e.getMessage());
            
            // ✅ 오류가 있어도 쿠키는 삭제
            Cookie deleteAccessToken = new Cookie("accessToken", "");
            deleteAccessToken.setHttpOnly(true);
            deleteAccessToken.setSecure(false);
            deleteAccessToken.setPath("/");
            deleteAccessToken.setMaxAge(0);
                
            Cookie deleteRefreshToken = new Cookie("refreshToken", "");
            deleteRefreshToken.setHttpOnly(true);
            deleteRefreshToken.setSecure(false);
            deleteRefreshToken.setPath("/");
            deleteRefreshToken.setMaxAge(0);
                
            response.addCookie(deleteAccessToken);
            response.addCookie(deleteRefreshToken);
            
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

    // ✅ MVC용 쿠키에서 토큰을 가져오는 헬퍼 메서드
    private String getTokenFromCookie(HttpServletRequest request, String cookieName) {
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookieName.equals(cookie.getName())) {
                    return cookie.getValue();
                }
            }
        }
        return null;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(HttpServletRequest request) {
        String token = getTokenFromCookie(request, "accessToken");
        if (token != null && JwtUtil.validateToken(token)) {
            Long userId = JwtUtil.getUserIdFromToken(token);
            
            Map<String, Object> userInfo = new HashMap<>();
            userInfo.put("userId", userId);
            
            return ResponseEntity.ok(userInfo);
        }
        return ResponseEntity.status(401).body("Unauthorized");
    }
}
//>>> Clean Arch / Inbound Adaptor