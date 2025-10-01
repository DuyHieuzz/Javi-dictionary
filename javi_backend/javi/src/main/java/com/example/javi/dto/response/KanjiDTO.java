package com.example.javi.dto.response;

import lombok.Data;

@Data
public class KanjiDTO {
    private Long id;
    private String characterName;
    private String sinoViName;
    private String meaning;
    private String level;
}
