package com.example.javi.dto.request;

import jakarta.validation.constraints.NotBlank;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
@JsonIgnoreProperties(ignoreUnknown = true) // chấp nhận cho fe gửi lên các trường thừa
public class GrammarExampleRequest {
    Long id;

    @NotBlank(message = "GRAMMAR_EXAMPLE_HAS_NO_JA_SENTENCE")
    String jaSentence;

    @NotBlank(message = "GRAMMAR_EXAMPLE_HAS_NO_TRANSCRIPTION")
    String transcription;

    @NotBlank(message = "GRAMMAR_EXAMPLE_HAS_NO_VI_SENTENCE")
    String viSentence;
}
