package service.infra;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import javax.naming.NameParser;
import javax.naming.NameParser;
import javax.transaction.Transactional;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cloud.stream.annotation.StreamListener;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Service;
import service.config.kafka.KafkaProcessor;
import service.domain.*;

//<<< Clean Arch / Inbound Adaptor
@Service
@Transactional
public class PolicyHandler {

    @Autowired
    AuthRepository authRepository;

    @Autowired
    private MailService mailService;

    @StreamListener(KafkaProcessor.INPUT)
    public void whatever(@Payload String eventString) {}

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='UserSaved'"
    )
    public void wheneverUserSaved_SavePassword(@Payload UserSaved userSaved) {
        UserSaved event = userSaved;
        System.out.println(
            "\n\n##### listener SavePassword : " + userSaved + "\n\n"
        );

        // Sample Logic //
        Auth.savePassword(event);
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='EmailExistsConfirmed'"
    )
    public void wheneverEmailExistsConfirmed_RequestEmailVerification(
        @Payload EmailExistsConfirmed emailExistsConfirmed
    ) {
        EmailExistsConfirmed event = emailExistsConfirmed;
        System.out.println(
            "\n\n##### listener RequestEmailVerification : " +
            emailExistsConfirmed +
            "\n\n"
        );

        Auth.requestEmailVerification(event);
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='UserRegistered'"
    )
    public void wheneverUserRegistered_RequestEmailVerification(
        @Payload UserRegistered userRegistered
    ) {
        UserRegistered event = userRegistered;
        System.out.println(
            "\n\n##### listener RequestEmailVerification : " +
            userRegistered +
            "\n\n"
        );

        // Sample Logic //
        Auth.requestEmailVerification(event);
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='EmailVerificationRequested'"
    )
    public void wheneverEmailVerificationRequested_RequestEmail(
        @Payload EmailVerificationRequested emailVerificationRequested
    ) {
        EmailVerificationRequested event = emailVerificationRequested;
        System.out.println(
            "\n\n##### listener RequestEmail : " +
            emailVerificationRequested +  // 변수명 수정 (기존 클래스명이었음)
            "\n\n"
        );
        
        String email = event.getEmail();
        String code = event.getEmailVerificationCode();
        
        if (email != null && code != null) {
            System.out.println("이메일 발송 시작: " + email + " (코드: " + code + ")");
            
            try {
                // MailService의 메인 메서드 사용
                mailService.sendVerificationEmail(email, code);
                // System.out.println("이메일 발송 성공: " + email);
            } catch (Exception e) {
                System.err.println("이메일 발송 실패: " + email + " - " + e.getMessage());
                
                // 실패 시 간단한 버전으로 재시도
                try {
                    mailService.sendVerificationEmailSimple(email, code);
                    // System.out.println("이메일 발송 성공 (Simple 버전): " + email);
                } catch (Exception e2) {
                    System.err.println("이메일 발송 완전 실패: " + email + " - " + e2.getMessage());
                    // 필요시 실패 이벤트 발행 가능
                }
            }
        } else {
            System.err.println("이메일 또는 인증코드가 없습니다. email: " + email + ", code: " + code);
        }
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='UserDeleted'"
    )
    public void wheneverUserDeleted_DeleteAuthData(
        @Payload UserDeleted userDeleted
    ) {
        UserDeleted event = userDeleted;
        System.out.println(
            "\n\n##### listener DeleteAuthData : " +
            userDeleted +
            "\n\n"
        );

        Auth.deleteAuthData(event);
    }
    
    // @StreamListener(
    //     value = KafkaProcessor.INPUT,
    //     condition = "headers['type']=='EmailVerified'"
    // )
    // public void wheneverEmailVerified_ResetPassword(
    //     @Payload EmailVerified emailVerified
    // ) {
    //     System.out.println("[이메일 인증 이벤트 - Auth] 목적: " + emailVerified.getPurpose());

    //     if ("PASSWORD_RESET".equals(emailVerified.getPurpose())) {
    //         System.out.println("PASSWORD_RESET 목적 - Auth.resetPassword 실행");
    //         Auth.resetPassword(emailVerified);
    //     } else {
    //         System.out.println("다른 목적의 이메일 인증 이벤트 수신됨: " + emailVerified.getPurpose());
    //     }
    // }
}
//>>> Clean Arch / Inbound Adaptor