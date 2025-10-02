package com.example.javi.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class MeaningDTO {
    private Long id;
    private String meaningVn;
    private String description;
    private List<ExampleDTO> examples;
}
