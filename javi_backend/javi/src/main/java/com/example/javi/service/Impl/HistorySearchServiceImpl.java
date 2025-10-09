package com.example.javi.service.Impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.javi.dto.response.HistorySearchResponse;
import com.example.javi.entity.EntityType;
import com.example.javi.entity.HistorySearch;
import com.example.javi.entity.Users;
import com.example.javi.mapper.HistorySearchMapper;
import com.example.javi.repository.HistorySearchRepository;
import com.example.javi.service.HistorySearchService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class HistorySearchServiceImpl implements HistorySearchService {
    HistorySearchRepository historySearchRepository;
    HistorySearchMapper historySearchMapper;

    @Override
    public HistorySearchResponse saveHistoryByKeyword(Users user, String keyword, EntityType type) {
        HistorySearch history = HistorySearch.builder()
                .user(user)
                .keyword(keyword)
                .entityType(type)
                .build();

        historySearchRepository.save(history);
        return historySearchMapper.toHistorySearchResponse(history);
    }

    @Override
    public HistorySearchResponse saveHistoryByEntity(Users user, Long entityId, EntityType type, String keyword) {
        HistorySearch history = HistorySearch.builder()
                .user(user)
                .entityId(entityId)
                .entityType(type)
                .keyword(keyword)
                .build();

        historySearchRepository.save(history);

        return historySearchMapper.toHistorySearchResponse(history);
    }

    @Override
    public Page<HistorySearch> getHistorySearch(Users user, Pageable pageable) {
        return historySearchRepository.findByUserOrderBySearchedAtDesc(user, pageable);
    }
}
