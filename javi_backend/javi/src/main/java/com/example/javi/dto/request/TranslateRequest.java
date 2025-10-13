package com.example.javi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class TranslateRequest {
    String sourceLang;

    @NotBlank(message = "TARGET_LANG_CANNOT_EMPTY")
    String targetLang = "vi";

    @NotBlank(message = "SOURCE_TEXT_CANNOT_EMPTY")
    @Size(max = 5000, message = "SOURCE_TEXT_TOO_LONG")
    String sourceText;

    String engine = "GOOGLE"; // Xác định dùng GOOGLE hay AI (GEMINI);
}
