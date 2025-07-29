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
        UserSaved userSaved = new UserSaved(this);
        userSaved.publishAfterCommit();

        // EmailNotFound emailNotFound = new EmailNotFound(this);
        // emailNotFound.publishAfterCommit();

        // EmailExistsConfirmed emailExistsConfirmed = new EmailExistsConfirmed(
        //     this
        // );
        // emailExistsConfirmed.publishAfterCommit();

        // UserRegistered userRegistered = new UserRegistered(this);
        // userRegistered.publishAfterCommit();
    }

    @PreUpdate
    public void onPreUpdate() {
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
        //implement business logic here:

        /** Example 1:  new item 
        User user = new User();
        repository().save(user);

        UserRegistered userRegistered = new UserRegistered(user);
        userRegistered.publishAfterCommit();
        */

        /** Example 2:  finding and process
        

        repository().findById(passwordSaved.get???()).ifPresent(user->{
            
            user // do something
            repository().save(user);

            UserRegistered userRegistered = new UserRegistered(user);
            userRegistered.publishAfterCommit();

         });
        */

    }

    //>>> Clean Arch / Port Method
    //<<< Clean Arch / Port Method
    public static void findUserIdByEmail(EmailVerified emailVerified) {
        repository().findById(emailVerified.getId()).ifPresent(user->{
            if(emailVerified.getPurpose().equals("FIND_ID")){
                // 아이디 반환하는 로직
                // 추가해야함
                
            }else if (emailVerified.getPurpose().equals("SIGNUP_VERIFY")){
                user.setStatus("EMAIL_VERIFIED");
                repository().save(user);
            }
         });

    }
    //>>> Clean Arch / Port Method

    

}
//>>> DDD / Aggregate Root
