package com.example.javi.dto.response;

import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

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
