package com.example.javi.entity;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "translation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Translation  {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    @JoinColumn(name = "userId")
    Users user;

    @Column(name = "source_lang")
    String sourceLang; // ngôn ngữ nguồn

    @Column(name = "target_lang")
    String targetLang; // ngôn ngữ đích

    @Column(name = "source_text", nullable = false, columnDefinition = "TEXT")
    String sourceText; // đoạn văn cần dịch

    @Column(name = "translated_text", nullable = false, columnDefinition = "TEXT")
    String translatedText; // đoạn văn đã dịch

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    EngineType engine;

    @CreationTimestamp
    private LocalDateTime createdAt;
}
