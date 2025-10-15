package com.example.javi.dto.response;

import java.time.LocalDateTime;

import com.example.javi.entity.EngineType;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TranslateResponse {
    Long id;
    String sourceLang;
    String targetLang;
    String sourceText;
    String translatedText;
    EngineType engine;
    LocalDateTime createdAt;
}
