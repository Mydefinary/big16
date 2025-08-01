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


}
//>>> Clean Arch / Inbound Adaptor
