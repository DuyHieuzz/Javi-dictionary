package com.example.javi.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TranslateResponse {
    String sourceLang;
    String targetLang;
    String sourceText;
    String translatedText;
}
