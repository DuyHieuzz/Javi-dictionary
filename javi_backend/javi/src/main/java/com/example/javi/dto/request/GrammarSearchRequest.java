package com.example.javi.dto.request;

import com.example.javi.entity.JlptLevel;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GrammarSearchRequest {
    String keyword;
    JlptLevel level;

}
