package com.example.javi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.javi.dto.response.HistorySearchResponse;
import com.example.javi.entity.HistorySearch;

@Mapper(componentModel = "spring")
public interface HistorySearchMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "entityName", target = "entityName")
    HistorySearchResponse toHistorySearchResponse(HistorySearch history);
}
