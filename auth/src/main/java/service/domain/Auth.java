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

@Entity
@Table(name = "Auth_table")
@Data
//<<< DDD / Aggregate Root
public class Auth {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long authId;

    private Long userId;

    private String loginId;

    private String passwordHash;

    private String refreshToken;

    // 이메일 인증을 위한 필드
    private String emailVerificationCode;
    // 제한시간
    private LocalDateTime codeGeneratedAt; 

    @PreUpdate
    public void onPreUpdate() {
        System.out.println("PreUpdate에서 비밀번호 재설정 되는지");
        // 어차피 이후 정책 발행을 하지 않아서 주석 처리함
        // PasswordEdited passwordEdited = new PasswordEdited(this);
        // passwordEdited.publishAfterCommit();
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
        Optional<Auth> authOptional = repository().findByEmail(emailExistsConfirmed.getEmail());

        if (authOptional.isPresent()) {
            Auth auth = authOptional.get();
            // 랜덤 인증 코드 생성 (6자리 숫자 예시)
            String code = String.format("%06d", new Random().nextInt(999999));

            auth.emailVerificationCode = code;
            auth.codeGeneratedAt = LocalDateTime.now();

            repository().save(auth);

            EmailVerificationRequested event = new EmailVerificationRequested(auth, emailExistsConfirmed.getEmail());
            event.publishAfterCommit();
        } else {
            // 어차피 UserBC에서 처리하기떄문에 복잡한 예외처리 없이 로그정도만
            System.out.println("이메일 없음");
        }

    }

    //인증코드 검증
    public boolean verifyCode(String inputCode) {
        // 코드가 없거나
        if (this.emailVerificationCode == null) return false;
        // 제한시간이 지났거나
        if (this.codeGeneratedAt.isBefore(LocalDateTime.now().minusMinutes(10))) return false;
        // 코드가 같은지 확인
        return this.emailVerificationCode.equals(inputCode);
    }

    //>>> Clean Arch / Port Method
    //<<< Clean Arch / Port Method
    public static void requestEmailVerification(UserRegistered userRegistered) {
        //implement business logic here:

        /** Example 1:  new item 
        Auth auth = new Auth();
        repository().save(auth);

        EmailVerificationRequested emailVerificationRequested = new EmailVerificationRequested(auth);
        emailVerificationRequested.publishAfterCommit();
        */

        /** Example 2:  finding and process
        

        repository().findById(userRegistered.get???()).ifPresent(auth->{
            
            auth // do something
            repository().save(auth);

            EmailVerificationRequested emailVerificationRequested = new EmailVerificationRequested(auth);
            emailVerificationRequested.publishAfterCommit();

         });
        */

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

    //<<< Clean Arch / Port Method
    // Policy를 사용하지 않기로 해서 폐기
    // public static void resetPassword(EmailVerified emailVerified) {
    //     // purpose가 PASSWORD_RESET 일 때만 수행
    //     if (!"PASSWORD_RESET".equals(emailVerified.getPurpose())) {
    //         System.out.println("[resetPassword] 비밀번호 재설정 목적이 아님. 무시함.");
    //         return;
    //     }

    //     repository().findByUserId(emailVerified.getUserId()).ifPresent(auth -> {
    //         // 새 비밀번호가 이벤트에 포함되어야 함 (예: emailVerified.getNewPassword())
    //         // 실제로는 별도 비밀번호 재설정 요청과 연동 필요

    //         // 임시로 새 비밀번호를 event에서 가져온다고 가정
    //         String newPassword = emailVerified.getNewPassword();
    //         if (newPassword == null || newPassword.isEmpty()) {
    //             System.out.println("[resetPassword] 새 비밀번호가 이벤트에 없습니다.");
    //             return;
    //         }

    //         // 비밀번호 암호화 및 저장
    //         String hashedPassword = BCrypt.hashpw(newPassword, BCrypt.gensalt());
    //         auth.setPasswordHash(hashedPassword);
    //         repository().save(auth);

    //         System.out.println("[resetPassword] 비밀번호 재설정 완료: userId = " + auth.getUserId());

    //         // 비밀번호 재설정 완료 이벤트 발행
    //         PasswordReseted passwordReseted = new PasswordReseted(auth);
    //         passwordReseted.publishAfterCommit();
    //     });
    }

    //>>> Clean Arch / Port Method

}
//>>> DDD / Aggregate Root
