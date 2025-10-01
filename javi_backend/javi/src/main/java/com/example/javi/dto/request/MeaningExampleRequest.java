package com.example.javi.dto.request;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MeaningExampleRequest {
    String jaSentence; // Câu ví dụ tiếng Nhật
    String viSentence; // Câu ví dụ tiếng Việt
}
