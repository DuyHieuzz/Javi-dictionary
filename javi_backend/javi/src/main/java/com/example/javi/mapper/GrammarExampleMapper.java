package com.example.javi.mapper;

import com.example.javi.dto.request.GrammarExampleRequest;
import com.example.javi.entity.Grammar;
import com.example.javi.entity.GrammarExample;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface GrammarExampleMapper {
    @Mapping(target = "id", ignore = true) // DB tự tạo ID
    @Mapping(target = "grammar", ignore = true)
    GrammarExample toGrammarExample(GrammarExampleRequest request);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "grammar", ignore = true)
    void updateGrammarExampleFromRequest(GrammarExampleRequest request, @MappingTarget GrammarExample example);

}
