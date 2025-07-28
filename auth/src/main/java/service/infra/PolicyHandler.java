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

        // Sample Logic //
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
        condition = "headers['type']=='EmailVerified'"
    )
    public void wheneverEmailVerified_ResetPassword(
        @Payload EmailVerified emailVerified
    ) {
        EmailVerified event = emailVerified;
        System.out.println(
            "\n\n##### listener ResetPassword : " + emailVerified + "\n\n"
        );

        // Sample Logic //
        Auth.resetPassword(event);
    }
}
//>>> Clean Arch / Inbound Adaptor
