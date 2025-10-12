package com.example.javi;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class JaviApplication {

    public static void main(String[] args) {
        SpringApplication.run(JaviApplication.class, args);
    }
}
