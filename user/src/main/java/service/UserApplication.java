package service;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.cloud.stream.annotation.EnableBinding;
import org.springframework.context.ApplicationContext;
import service.config.kafka.KafkaProcessor;
// 주석추가
@SpringBootApplication
@EnableBinding(KafkaProcessor.class)
@EnableFeignClients
public class UserApplication {

    public static ApplicationContext applicationContext;

    public static void main(String[] args) {
        applicationContext = SpringApplication.run(UserApplication.class, args);
    }
}
