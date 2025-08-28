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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

//<<< Clean Arch / Inbound Adaptor
@Service
@Transactional
public class PolicyHandler {

    private static final Logger logger = LoggerFactory.getLogger(PolicyHandler.class);

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
        try {
            UserSaved event = userSaved;
            logger.info("사용자 비밀번호 저장 이벤트 처리 시작");

            // Sample Logic //
            Auth.savePassword(event);
            
            logger.info("사용자 비밀번호 저장 이벤트 처리 완료");
            
        } catch (Exception e) {
            logger.error("사용자 비밀번호 저장 처리 중 오류 발생", e);
        }
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='EmailExistsConfirmed'"
    )
    public void wheneverEmailExistsConfirmed_RequestEmailVerification(
        @Payload EmailExistsConfirmed emailExistsConfirmed
    ) {
        try {
            EmailExistsConfirmed event = emailExistsConfirmed;
            logger.info("이메일 존재 확인 후 인증 요청 이벤트 처리 시작");

            Auth.requestEmailVerification(event);
            
            logger.info("이메일 존재 확인 후 인증 요청 이벤트 처리 완료");
            
        } catch (Exception e) {
            logger.error("이메일 존재 확인 후 인증 요청 처리 중 오류 발생", e);
        }
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='UserRegistered'"
    )
    public void wheneverUserRegistered_RequestEmailVerification(
        @Payload UserRegistered userRegistered
    ) {
        try {
            UserRegistered event = userRegistered;
            logger.info("사용자 등록 후 이메일 인증 요청 이벤트 처리 시작");

            // Sample Logic //
            Auth.requestEmailVerification(event);
            
            logger.info("사용자 등록 후 이메일 인증 요청 이벤트 처리 완료");
            
        } catch (Exception e) {
            logger.error("사용자 등록 후 이메일 인증 요청 처리 중 오류 발생", e);
        }
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='EmailVerificationRequested'"
    )
    public void wheneverEmailVerificationRequested_RequestEmail(
        @Payload EmailVerificationRequested emailVerificationRequested
    ) {
        try {
            EmailVerificationRequested event = emailVerificationRequested;
            logger.info("이메일 인증 요청 이벤트 처리 시작");
            
            String email = event.getEmail();
            String code = event.getEmailVerificationCode();
            
            if (email != null && code != null) {
                logger.info("이메일 발송 시작");
                
                try {
                    // MailService의 메인 메서드 사용
                    mailService.sendVerificationEmail(email, code);
                    logger.info("이메일 발송 성공");
                } catch (Exception e) {
                    logger.warn("메인 이메일 발송 실패, 간단한 버전으로 재시도");
                    
                    // 실패 시 간단한 버전으로 재시도
                    try {
                        mailService.sendVerificationEmailSimple(email, code);
                        logger.info("이메일 발송 성공 (Simple 버전)");
                    } catch (Exception e2) {
                        logger.error("이메일 발송 완전 실패", e2);
                        // 필요시 실패 이벤트 발행 가능
                    }
                }
            } else {
                logger.warn("이메일 또는 인증코드가 누락됨");
            }
            
        } catch (Exception e) {
            logger.error("이메일 인증 요청 처리 중 오류 발생", e);
        }
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='UserDeleted'"
    )
    public void wheneverUserDeleted_DeleteAuthData(
        @Payload UserDeleted userDeleted
    ) {
        try {
            UserDeleted event = userDeleted;
            logger.info("사용자 삭제에 따른 인증 데이터 삭제 이벤트 처리 시작");

            Auth.deleteAuthData(event);
            
            logger.info("사용자 삭제에 따른 인증 데이터 삭제 이벤트 처리 완료");
            
        } catch (Exception e) {
            logger.error("사용자 삭제에 따른 인증 데이터 삭제 처리 중 오류 발생", e);
        }
    }
}
//>>> Clean Arch / Inbound Adaptor