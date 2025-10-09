package com.example.javi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.javi.dto.response.HistorySearchResponse;
import com.example.javi.entity.EntityType;
import com.example.javi.entity.HistorySearch;
import com.example.javi.entity.Users;

public interface HistorySearchService {
    HistorySearchResponse saveHistoryByKeyword(Users user, String keyword, EntityType type);

    HistorySearchResponse saveHistoryByEntity(Users user, Long entityId, EntityType type, String keyword);

    Page<HistorySearch> getHistorySearch(Users user, Pageable pageable);
}
