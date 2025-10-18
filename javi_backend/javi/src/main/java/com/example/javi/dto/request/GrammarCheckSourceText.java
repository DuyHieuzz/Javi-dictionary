package com.example.javi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GrammarCheckSourceText {
    @NotBlank(message = "SOURCE_TEXT_CANNOT_EMPTY")
    @Size(max = 5000, message = "SOURCE_TEXT_TOO_LONG")
    String sourceText;

    @Builder.Default
    String targetLang = "vi";
}
