package com.example.javi.dto.request;

import jakarta.validation.constraints.NotBlank;

import com.example.javi.entity.JlptLevel;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KanjiRequest {
    @NotBlank(message = "EMPTY_KANJI")
    String characterName;

    String sinoViName;

    @NotBlank(message = "KANJI_HAS_NO_MEANING")
    String meaning;

    JlptLevel level;
}
