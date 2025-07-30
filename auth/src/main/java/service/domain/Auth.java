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

    @PreUpdate
    public void onPreUpdate() {
        PasswordEdited passwordEdited = new PasswordEdited(this);
        passwordEdited.publishAfterCommit();
    }

    public static AuthRepository repository() {
        AuthRepository authRepository = AuthApplication.applicationContext.getBean(
            AuthRepository.class
        );
        return authRepository;
    }

    //<<< Clean Arch / Port Method
    public static void savePassword(UserSaved userSaved) {
        AuthRepository authRepository = repository();

        // 신규 가입 시 authId가 없으므로 새 엔티티 생성
        Auth auth = new Auth();

        auth.setUserId(userSaved.getUserId());
        auth.setLoginId(userSaved.getLoginId());
        auth.setPasswordHash(userSaved.getPassword());  // 이미 암호화된 비밀번호가 이벤트에 담겨 있다고 가정

        authRepository.save(auth);

        // 저장 후 이벤트 발행 (필요하다면)
        PasswordSaved passwordSavedEvent = new PasswordSaved(auth);
        passwordSavedEvent.publishAfterCommit();
    }

    //>>> Clean Arch / Port Method
    //<<< Clean Arch / Port Method
    public static void requestEmailVerification(
        EmailExistsConfirmed emailExistsConfirmed
    ) {
        //implement business logic here:

        /** Example 1:  new item 
        Auth auth = new Auth();
        repository().save(auth);

        EmailVerificationRequested emailVerificationRequested = new EmailVerificationRequested(auth);
        emailVerificationRequested.publishAfterCommit();
        */

        /** Example 2:  finding and process
        

        repository().findById(emailExistsConfirmed.get???()).ifPresent(auth->{
            
            auth // do something
            repository().save(auth);

            EmailVerificationRequested emailVerificationRequested = new EmailVerificationRequested(auth);
            emailVerificationRequested.publishAfterCommit();

         });
        */

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
    //<<< Clean Arch / Port Method
    public static void resetPassword(EmailVerified emailVerified) {
        //implement business logic here:

        /** Example 1:  new item 
        Auth auth = new Auth();
        repository().save(auth);

        PasswordReseted passwordReseted = new PasswordReseted(auth);
        passwordReseted.publishAfterCommit();
        */

        /** Example 2:  finding and process
        

        repository().findById(emailVerified.get???()).ifPresent(auth->{
            
            auth // do something
            repository().save(auth);

            PasswordReseted passwordReseted = new PasswordReseted(auth);
            passwordReseted.publishAfterCommit();

         });
        */

    }
    //>>> Clean Arch / Port Method

}
//>>> DDD / Aggregate Root
