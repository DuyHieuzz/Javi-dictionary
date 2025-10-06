package com.example.javi.dto.request;

import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MeaningRequest {
    String meaningVn; // Nghĩa tiếng Việt
    String description; // Mô tả thêm
    List<MeaningExampleRequest> examples; // Danh sách ví dụ
}
