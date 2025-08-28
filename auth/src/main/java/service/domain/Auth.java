package service.domain;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;
import javax.persistence.*;
import lombok.Data;
import service.AuthApplication;
import service.domain.EmailVerificationFailed;
import service.domain.EmailVerificationRequested;
import service.domain.EmailVerified;
import service.domain.LoginFailed;
import service.domain.LoginSuccessed;
import service.domain.PasswordEdited;
import service.domain.PasswordReseted;
import service.domain.PasswordSaved;
import java.util.Random;
import java.time.LocalDateTime;
import org.mindrot.jbcrypt.BCrypt;
import java.util.Optional;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Entity
@Table(name = "Auth_table")
@Data
//<<< DDD / Aggregate Root
public class Auth {

    private static final Logger logger = LoggerFactory.getLogger(Auth.class);

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long authId;

    private Long userId;

    private String loginId;

    private String email;

    private String passwordHash;

    private boolean isVerified = false;

    private Date createdAt;

    private String nickname;

    private String role;

    private boolean termsAgreed=true;

    private boolean isCompanyRegistered=false;

    // 토큰 관리 필드들
    private String accessToken;       
    private String refreshToken;      
    private LocalDateTime tokenIssuedAt;   // 토큰 발급 시간 (선택사항)
    private String emailToken;
    
    // 이메일 인증 필드들
    private String emailVerificationCode;
    private LocalDateTime codeGeneratedAt; 
    private String purpose;

    // 토큰 업데이트 메서드 추가
    public void updateTokens(String accessToken, String refreshToken) {
        this.accessToken = accessToken;
        this.refreshToken = refreshToken;
        this.tokenIssuedAt = LocalDateTime.now();
    }
    
    // 토큰 무효화 메서드
    public void invalidateTokens() {
        this.accessToken = null;
        this.refreshToken = null;
        this.tokenIssuedAt = null;
        this.emailToken= null;
    }

    @PreUpdate
    public void onPreUpdate() {
        
    }

    public static AuthRepository repository() {
        AuthRepository authRepository = AuthApplication.applicationContext.getBean(
            AuthRepository.class
        );
        return authRepository;
    }

    //<<< Clean Arch / Port Method
    public static void savePassword(UserSaved userSaved) {
        // 신규 가입 시 authId가 없으므로 새 엔티티 생성
        Auth auth = new Auth();

        auth.setUserId(userSaved.getUserId());
        auth.setLoginId(userSaved.getLoginId());
        auth.setPasswordHash(userSaved.getPassword());  // 이미 암호화된 비밀번호가 이벤트에 담겨 있다고 가정
        auth.setEmail(userSaved.getEmail());
        auth.setCreatedAt(userSaved.getCreatedAt());
        auth.setNickname(userSaved.getNickname());
        auth.setRole(userSaved.getRole());

        repository().save(auth);

        // 저장 후 이벤트 발행 (필요하다면)
        PasswordSaved passwordSavedEvent = new PasswordSaved(auth);
        passwordSavedEvent.publishAfterCommit();
    }

    //>>> Clean Arch / Port Method
    //<<< Clean Arch / Port Method
    public static void requestEmailVerification(
        EmailExistsConfirmed emailExistsConfirmed
    ) {
        Optional<Auth> authOptional = repository().findByUserId(emailExistsConfirmed.getUserId());

        if (authOptional.isPresent()) {
            Auth auth = authOptional.get();
            String code = String.format("%06d", new Random().nextInt(999999));
            
            auth.setPurpose("PASSWORD_RESET");
            auth.setEmailVerificationCode(code);

            auth.codeGeneratedAt = LocalDateTime.now();

            repository().save(auth);

            EmailVerificationRequested event = new EmailVerificationRequested(auth);
            event.publishAfterCommit();
        } else {
            // 보안상 구체적인 정보 노출 방지
            logger.debug("Email verification request failed for user authentication");
        }

    }

    //인증코드 검증
    public boolean verifyCode(String inputCode) {
        // 코드가 없거나
        if (this.emailVerificationCode == null) return false;
        // 제한시간이 지났거나
        if (this.codeGeneratedAt.isBefore(LocalDateTime.now().minusMinutes(10))) return false;
        // 코드가 같은지 확인

        isVerified = this.emailVerificationCode.equals(inputCode);

        if(isVerified){
            EmailVerified event = new EmailVerified(this);
            event.publish();
        }
        // 이메일 인증 실패 이벤트는 이후 실행하는거 없어서 주석 처리
        // EmailVerificationFailed event = new EmailVerificationFailed(this);
        return isVerified;
    }

    //>>> Clean Arch / Port Method
    //<<< Clean Arch / Port Method
    public static void requestEmailVerification(UserRegistered userRegistered) {
        Optional<Auth> authOptional = repository().findByUserId(userRegistered.getUserId());

        if (authOptional.isPresent()) {
            Auth auth = authOptional.get();
            // 랜덤 인증 코드 생성 (6자리 숫자 예시)
            String code = String.format("%06d", new Random().nextInt(999999));
            
            auth.setPurpose("SIGN_UP_VERIFICATION");
            auth.setEmailVerificationCode(code);
            auth.codeGeneratedAt = LocalDateTime.now();

            repository().save(auth);

            EmailVerificationRequested event = new EmailVerificationRequested(auth);
            event.publishAfterCommit();
        } else {
            // 보안상 구체적인 정보 노출 방지
            logger.debug("Email verification request failed for user registration");
        }

    }

    //>>> Clean Arch / Port Method

    // public void resetPassword(String email, String newPassword) {
    public void resetPassword(String newPassword) {    
        // 컨트롤러에서 식별해놓은거라 없어도됨
        // Auth auth = repository().findByEmail(email)
        //     .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        this.setPasswordHash(BCrypt.hashpw(newPassword, BCrypt.gensalt()));
        repository().save(this);
    }

    // 로그인 검증
    public String verifyPassword(String inputPassword) {
        if (!BCrypt.checkpw(inputPassword, this.passwordHash)) {
            throw new IllegalArgumentException("Authentication failed");
        }
        return this.loginId; // 로그인 ID 반환 (토큰 생성에 사용)
    }

    public void resendEmailVerification() {
        // 새로운 인증코드 생성
        String newCode = this.generateNewVerificationCode();
        
        // 이벤트 발행 (기존 EmailVerificationRequested 재사용)
        EmailVerificationRequested event = new EmailVerificationRequested(this);
        event.publishAfterCommit();
    }

    public String generateNewVerificationCode() {
        // 6자리 랜덤 숫자 생성
        String code = String.format("%06d", new Random().nextInt(999999));
        
        // 생성된 코드를 Auth 엔티티에 저장 (기존 필드 사용)
        this.emailVerificationCode = code;
        
        // 코드 생성 시간 업데이트 (기존 필드 사용)
        this.codeGeneratedAt = LocalDateTime.now();
        
        return code;
    }

    public boolean canResendCode() {
        // 마지막 코드 생성 후 1분이 지나야 재발송 가능
        if (this.codeGeneratedAt != null && 
            this.codeGeneratedAt.isAfter(LocalDateTime.now().minusMinutes(1))) {
            return false;
        }
        return true;
    }
    
    // 삭제
    public static void deleteAuthData(UserDeleted userDeleted) {
        Optional<Auth> authOptional = repository().findByUserId(userDeleted.getUserId());
        
        if (authOptional.isPresent()) {
            Auth auth = authOptional.get();
            
            // 토큰 무효화 (혹시 다른 곳에서 참조하고 있을 수도 있으니)
            auth.invalidateTokens();
            
            // Auth 데이터 완전 삭제
            repository().delete(auth);
            
            logger.info("Auth data deletion completed for user withdrawal");
        } else {
            logger.debug("No Auth data found for deletion request");
        }
    }
}
//>>> DDD / Aggregate Root