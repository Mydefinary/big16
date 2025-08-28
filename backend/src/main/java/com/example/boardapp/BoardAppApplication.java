package com.example.boardapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.web.client.RestTemplate;

/**
 * Entry point for the Spring Boot application.
 */
@SpringBootApplication
public class BoardAppApplication {
    public static void main(String[] args) {
        SpringApplication.run(BoardAppApplication.class, args);
    }

    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}