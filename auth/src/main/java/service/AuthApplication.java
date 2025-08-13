// 메일, DB 충돌 처리 auth/src/main/java/service/AuthApplication.java

package service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.cloud.stream.annotation.EnableBinding;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;
import service.config.kafka.KafkaProcessor;
import org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration; // ✅ [추가] import

@SpringBootApplication(
    // ✅ [수정] 문제가 되는 MailSender 자동 설정을 제외합니다.
    exclude = MailSenderAutoConfiguration.class
)
@EnableBinding(KafkaProcessor.class)
@EnableFeignClients
@EnableScheduling
public class AuthApplication {

    public static ApplicationContext applicationContext;

    public static void main(String[] args) {
        applicationContext = SpringApplication.run(AuthApplication.class, args);
    }
}


/* 이전 코드
package service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.cloud.stream.annotation.EnableBinding;
import org.springframework.context.ApplicationContext;
import org.springframework.scheduling.annotation.EnableScheduling;
import service.config.kafka.KafkaProcessor;

@SpringBootApplication
@EnableBinding(KafkaProcessor.class)
@EnableFeignClients
@EnableScheduling
public class AuthApplication {

    public static ApplicationContext applicationContext;

    public static void main(String[] args) {
        applicationContext = SpringApplication.run(AuthApplication.class, args);
    }
} */
