package com.example.javi.dto.response;

import lombok.Data;

import java.util.List;

@Data
public class MeaningDTO {
    private Long id;
    private String meaningVn;
    private String description;
    private List<ExampleDTO> examples;
}
