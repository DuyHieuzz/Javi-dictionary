package com.example.javi.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VocabUpdateResponse {
    Long id;
    String word;
    String hiragana;
    String katakana;
    String romaji;
    String level;
    String wordType;
    List<MeaningDTO> meanings;
    List<KanjiResponse> kanjis;
}

