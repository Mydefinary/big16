package service.domain;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Date;
import java.util.List;
import java.util.Map;
import javax.persistence.*;
import lombok.Data;
import service.UserApplication;
import service.domain.EmailExistsConfirmed;
import service.domain.EmailNotFound;
import service.domain.UserDeleted;
import service.domain.UserRegistered;
import service.domain.UserSaved;

@Entity
@Table(name = "User_table")
@Data
//<<< DDD / Aggregate Root
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private Long userId;

    private String loginId;

    private String email;

    private String nickname;

    private Date createdAt;

    private String role;

    private String status;

    private String company;

    @PostPersist
    public void onPostPersist() {
        // UserSaved userSaved = new UserSaved(this);
        // userSaved.publishAfterCommit();

    }

    @PreUpdate
    public void onPreUpdate() {
        // System.out.println("회원탈퇴 실행");
        
    }

    public void Withdrawal(){
        UserDeleted userDeleted = new UserDeleted(this);
        userDeleted.publishAfterCommit();
    }

    public static UserRepository repository() {
        UserRepository userRepository = UserApplication.applicationContext.getBean(
            UserRepository.class
        );
        return userRepository;
    }

    //<<< Clean Arch / Port Method
    public static void userRegister(PasswordSaved passwordSaved) {
       repository().findById(passwordSaved.getUserId()).ifPresent(user -> {
            // 이메일 인증 전 상태로 초기화
            user.setStatus("EMAIL_NOT_VERIFIED");
            repository().save(user);

            UserRegistered userRegistered = new UserRegistered(user);
            userRegistered.publishAfterCommit();

            // 필요하다면 이메일 인증 요청 이벤트 발행 가능
            // 예: Auth BC로 인증 코드 발송 요청 등
        });
    }

    //>>> Clean Arch / Port Method
    //<<< Clean Arch / Port Method
    public static void findUserIdByEmail(EmailVerified emailVerified) {
        repository().findById(emailVerified.getUserId()).ifPresent(user->{
            // 아이디 반환 로직 짜려고 넣은 Policy였는데 프론트에서
            // GetMapping 할거라 여기서 뭔가 할 필요는 없음
            // 근데 회원가입 시 이메일 인증 되는 로직을 안만들어서
            // 여기서 수행 시키기로함

            // Auth BC 내부에도 해당 이벤트에 대한 Policy가 있어서
            // 무시하기 위해 사용
            if ("SIGN_UP_VERIFICATION".equals(emailVerified.getPurpose())) {
                user.setStatus("EMAIL_VERIFIED");
                repository().save(user);
            }
         });

    }
    //>>> Clean Arch / Port Method

    public void publishEmailExistsConfirmed() {
        EmailExistsConfirmed event = new EmailExistsConfirmed(this);
        event.publish();
    }
    

}
//>>> DDD / Aggregate Root
