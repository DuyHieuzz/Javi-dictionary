package com.example.javi.mapper;

import com.example.javi.dto.request.CreateGrammarRequest;
import com.example.javi.dto.request.UpdateGrammarRequest;
import com.example.javi.dto.response.GrammarResponse;
import com.example.javi.entity.Grammar;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface GrammarMapper {
    @Mapping(target = "grammarId", ignore = true)
    @Mapping(target = "examples", ignore = true)
    Grammar toGrammar(CreateGrammarRequest request);

    @Mapping(target = "grammarId", ignore = true)
    @Mapping(target = "examples", ignore = true)
    void updateGrammarFromRequest(UpdateGrammarRequest request, @MappingTarget Grammar grammar);

    @Mapping(source = "grammarId", target = "id")
    GrammarResponse toGrammarResponse(Grammar grammar);

}
