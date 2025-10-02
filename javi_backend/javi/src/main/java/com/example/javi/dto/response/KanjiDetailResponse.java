package com.example.javi.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class KanjiDetailResponse {
    private Long id;
    private String characterName;
    private String sinoViName;
    private List<String> kunyomi;
    private List<String> onyomi;
    private Integer stroke;
    private String videoUrl;
    private String meaning;
    private String level;
}
