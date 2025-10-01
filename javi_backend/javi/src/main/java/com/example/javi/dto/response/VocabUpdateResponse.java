package com.example.javi.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class VocabUpdateResponse {
    private Long id;
    private String word;
    private String hiragana;
    private String katakana;
    private String romaji;
    private String level;
    private String wordType;
    private List<MeaningDTO> meanings;
    private List<KanjiDTO> kanjis;
}

