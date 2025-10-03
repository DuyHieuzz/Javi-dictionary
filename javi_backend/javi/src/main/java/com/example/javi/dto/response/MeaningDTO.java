package com.example.javi.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class MeaningDTO {
    Long id;
    String meaningVn;
    String description;
    List<ExampleDTO> examples;
}
