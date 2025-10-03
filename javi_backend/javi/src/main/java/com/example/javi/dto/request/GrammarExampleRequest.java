package com.example.javi.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GrammarExampleRequest {
    Long id;

    @NotBlank(message = "GRAMMAR_EXAMPLE_HAS_NO_JA_SENTENCE")
    String jaSentence;

    @NotBlank(message = "GRAMMAR_EXAMPLE_HAS_NO_TRANSCRIPTION")
    String transcription;

    @NotBlank(message = "GRAMMAR_EXAMPLE_HAS_NO_VI_SENTENCE")
    String viSentence;
}
