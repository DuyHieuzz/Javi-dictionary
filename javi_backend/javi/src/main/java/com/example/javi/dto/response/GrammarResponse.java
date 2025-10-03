package com.example.javi.dto.response;

import com.example.javi.entity.GrammarExample;
import com.example.javi.entity.JlptLevel;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GrammarResponse {
    Long id;

    String pattern; //mẫu câu ngữ pháp

    String meaning; //nghĩa khi dịch ngữ pháp

    String structure; //cách chia ngữ pháp

    String usageNote; //phạm vị sử dụng

    JlptLevel level;

    List<GrammarExample> examples;
}
