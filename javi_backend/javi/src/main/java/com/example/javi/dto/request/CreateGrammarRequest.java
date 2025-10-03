package com.example.javi.dto.request;

import com.example.javi.entity.JlptLevel;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateGrammarRequest {
    @NotBlank(message = "GRAMMAR_HAS_NO_PATTERN")
    String pattern; //mẫu câu ngữ pháp

    @NotBlank(message = "GRAMMAR_HAS_NO_MEANING")
    String meaning; //nghĩa khi dịch ngữ pháp

    @NotBlank(message = "GRAMMAR_HAS_NO_STRUCTURE")
    String structure; //cách chia ngữ pháp

    @NotBlank(message = "GRAMMAR_HAS_NO_USAGE_NOTE")
    String usageNote; //phạm vị sử dụng

    JlptLevel level;

    @Valid
    List<GrammarExampleRequest> examples;
}
