package com.example.javi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.example.javi.dto.request.VocabUpdateDTO;
import com.example.javi.dto.response.VocabUpdateResponse;
import com.example.javi.entity.Vocabularies;

@Mapper(componentModel = "spring")
public interface VocabulariesMapper {
    @Mapping(target = "meanings", ignore = true)
    void toVocabularies(@MappingTarget Vocabularies vocab, VocabUpdateDTO vocabUpdateDTO);

    VocabUpdateResponse toDto(Vocabularies vocab);
}
