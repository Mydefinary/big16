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

//<<< Clean Arch / Inbound Adaptor
@Service
@Transactional
public class PolicyHandler {

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
        PasswordSaved event = passwordSaved;
        System.out.println(
            "\n\n##### listener UserRegister : " + passwordSaved + "\n\n"
        );

        // Comments //
        //status를 활성화로 바꿉시다~

        // Sample Logic //
        User.userRegister(event);
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='EmailVerified'"
    )
    public void wheneverEmailVerified_FindUserIdByEmail(
        @Payload EmailVerified emailVerified
    ) {
        System.out.println("[이메일 인증 이벤트] 목적: " + emailVerified.getPurpose());

        if ("SIGN_UP_VERIFICATION".equals(emailVerified.getPurpose())) {
            System.out.println("SIGN_UP_VERIFICATION 목적 - User.findUserIdByEmail 실행");
            User.findUserIdByEmail(emailVerified);
        } else {
            System.out.println("다른 목적의 이메일 인증 이벤트 수신됨: " + emailVerified.getPurpose());
        }
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='UnverifiedAccountsDeleted'"
    )
    public void wheneverUnverifiedAccountsDeleted_DeleteUsers(
        @Payload UnverifiedAccountsDeleted unverifiedAccountsDeleted
    ) {
        System.out.println(
            "\n\n##### listener DeleteUsers : " + unverifiedAccountsDeleted + "\n\n"
        );
        
        List<Long> userIds = unverifiedAccountsDeleted.getUserIds();
        
        if (userIds != null && !userIds.isEmpty()) {
            try {
                // User 엔티티에 정리 로직 위임
                User.deleteUnverifiedUsers(userIds);
                
                System.out.println("연관 사용자 " + userIds.size() + "개 삭제 완료");
                
            } catch (Exception e) {
                System.err.println("사용자 삭제 중 오류: " + e.getMessage());
            }
        }
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='RoleChange'"
    )
    public void wheneverRoleChange_ChangeRole(
        @Payload RoleChange roleChange
    ) {
        System.out.println(
            "\n\n##### listener DeleteUsers : " + roleChange + "\n\n"
        );
        
        User.ChangeRole(roleChange);
    }

    @StreamListener(
        value = KafkaProcessor.INPUT,
        condition = "headers['type']=='RegisterCompany'"
    )
    public void wheneverRegisterCompany_CompanyRegister(
        @Payload RegisterCompany registerCompany
    ) {
        System.out.println(
            "\n\n##### listener DeleteUsers : " + registerCompany + "\n\n"
        );
        
        User.ChangeCompanyName(registerCompany);
    }
}
//>>> Clean Arch / Inbound Adaptor
