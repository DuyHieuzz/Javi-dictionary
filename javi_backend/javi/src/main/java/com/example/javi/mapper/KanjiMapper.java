package com.example.javi.mapper;

import com.example.javi.dto.request.KanjiRequest;
import com.example.javi.dto.response.KanjiDetailResponse;
import com.example.javi.dto.response.KanjiResponse;
import com.example.javi.entity.Kanji;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface KanjiMapper {
//    @Mapping(target = "vocabularies", ignore = true)
    KanjiResponse toKanjiResponse(Kanji kanji);

    @Mapping(target = "vocabularies", ignore = true)
    Kanji toKanji(KanjiRequest request);

    @Mapping(target = "id", ignore = true) //id không bị ghi đè
    @Mapping(target = "vocabularies", ignore = true)
    void updateKanjiFromDTO(KanjiRequest request, @MappingTarget Kanji kanji);

    KanjiDetailResponse toKanjiDetailResponse(Kanji kanji);
}
