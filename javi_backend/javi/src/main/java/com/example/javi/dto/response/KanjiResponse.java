package com.example.javi.dto.response;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KanjiResponse {
    private Long id;
    private String characterName;
    private String sinoViName;
    private String meaning;
    private String level;
}
