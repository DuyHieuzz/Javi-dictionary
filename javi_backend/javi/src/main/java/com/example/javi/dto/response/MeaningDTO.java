package com.example.javi.dto.response;

import java.util.List;

import lombok.*;
import lombok.experimental.FieldDefaults;

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
