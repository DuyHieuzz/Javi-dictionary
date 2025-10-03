package com.example.javi.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KanjiDetailResponse {
    Long id;
    String characterName;
    String sinoViName;
    List<String> kunyomi;
    List<String> onyomi;
    Integer stroke;
    String videoUrl;
    String meaning;
    String level;
}
