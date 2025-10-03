package com.example.javi.dto.response;


import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class KanjiResponse {
    Long grammarId;
    String characterName;
    String sinoViName;
    String meaning;
    String level;
}
