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
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

//<<< Clean Arch / Inbound Adaptor
@Service
@Transactional
public class PolicyHandler {

    private static final Logger logger = LoggerFactory.getLogger(PolicyHandler.class);

    @Autowired
    UserRepository userRepository;

    @StreamListener(KafkaProcessor.INPUT)
    public void whatever(@Payload String eventString) {}

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='PasswordSaved'"
    )
    public void wheneverPasswordSaved_UserRegister(
        @Payload PasswordSaved passwordSaved
    ) {
        try {
            PasswordSaved event = passwordSaved;
            logger.info("사용자 등록 이벤트 처리 시작");
            
            // Comments //
            //status를 활성화로 바꿉시다~

            // Sample Logic //
            User.userRegister(event);
            
            logger.info("사용자 등록 이벤트 처리 완료");
            
        } catch (Exception e) {
            logger.error("사용자 등록 이벤트 처리 중 오류 발생", e);
        }
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='EmailVerified'"
    )
    public void wheneverEmailVerified_FindUserIdByEmail(
        @Payload EmailVerified emailVerified
    ) {
        try {
            logger.info("이메일 인증 이벤트 수신 - 목적: {}", emailVerified.getPurpose());

            if ("SIGN_UP_VERIFICATION".equals(emailVerified.getPurpose())) {
                logger.info("회원가입 이메일 인증 처리 시작");
                User.findUserIdByEmail(emailVerified);
                logger.info("회원가입 이메일 인증 처리 완료");
            } else {
                logger.info("다른 목적의 이메일 인증 이벤트: {}", emailVerified.getPurpose());
            }
            
        } catch (Exception e) {
            logger.error("이메일 인증 이벤트 처리 중 오류 발생", e);
        }
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='UnverifiedAccountsDeleted'"
    )
    public void wheneverUnverifiedAccountsDeleted_DeleteUsers(
        @Payload UnverifiedAccountsDeleted unverifiedAccountsDeleted
    ) {
        try {
            logger.info("미인증 계정 삭제 이벤트 처리 시작");
            
            List<Long> userIds = unverifiedAccountsDeleted.getUserIds();

            if (userIds != null && !userIds.isEmpty()) {
                logger.info("삭제 대상 사용자 수: {}", userIds.size());
                
                // User 엔티티에 정리 로직 위임
                User.deleteUnverifiedUsers(userIds);

                logger.info("미인증 사용자 삭제 처리 완료 - 대상: {}개", userIds.size());

            } else {
                logger.warn("삭제할 사용자 ID 목록이 비어있음");
            }
            
        } catch (Exception e) {
            logger.error("미인증 사용자 삭제 처리 중 오류 발생", e);
        }
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='RoleChange'"
    )
    public void wheneverRoleChange_ChangeRole(
        @Payload RoleChange roleChange
    ) {
        try {
            logger.info("사용자 역할 변경 이벤트 처리 시작");
            
            User.ChangeRole(roleChange);
            
            logger.info("사용자 역할 변경 이벤트 처리 완료");
            
        } catch (Exception e) {
            logger.error("사용자 역할 변경 처리 중 오류 발생", e);
        }
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='RegisterCompany'"
    )
    public void wheneverRegisterCompany_CompanyRegister(
        @Payload RegisterCompany registerCompany
    ) {
        try {
            logger.info("회사 등록 이벤트 처리 시작");
            
            User.ChangeCompanyName(registerCompany);
            
            logger.info("회사 등록 이벤트 처리 완료");
            
        } catch (Exception e) {
            logger.error("회사 등록 처리 중 오류 발생", e);
        }
    }
}
//>>> Clean Arch / Inbound Adaptor