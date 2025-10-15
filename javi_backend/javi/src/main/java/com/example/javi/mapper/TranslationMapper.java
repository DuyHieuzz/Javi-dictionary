package com.example.javi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.TranslateResponse;
import com.example.javi.entity.Translation;

@Mapper(componentModel = "spring")
public interface TranslationMapper {
    TranslateResponse toTranslateResponse(TranslateRequest translateRequest);

    Translation toTranslation(TranslateRequest translateRequest);

    @Mapping(target = "createdAt", source = "createdAt")
    TranslateResponse translationToTranslateResponse(Translation translation);
}
