package com.example.javi.service.Impl;

import java.util.List;

import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.repository.GrammarRepository;
import com.example.javi.repository.KanjiRepository;
import com.example.javi.repository.VocabulariesRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    VocabulariesRepository vocabulariesRepository;
    KanjiRepository kanjiRepository;
    GrammarRepository grammarRepository;

    int MAX_HISTORY_PER_USER = 300;

    private String normalize(String keyword) {
        if (keyword == null) return null;
        return keyword.trim().replaceAll("\\s+", " ");
    }

    @Override
    @Transactional
    public HistorySearchResponse saveHistoryByKeyword(Users user, String keyword, EntityType type) {
        if (user == null) return null;
        String normalized = normalize(keyword);
        if (normalized == null || normalized.isEmpty()) return null;
        HistorySearch history = HistorySearch.builder()
                .user(user)
                .keyword(normalized)
                .entityType(type)
                .build();

        historySearchRepository.save(history);
        historySearchRepository.trimOldHistory(user.getId(), MAX_HISTORY_PER_USER);
        return historySearchMapper.toHistorySearchResponse(history);
    }

    @Override
    @Transactional
    public HistorySearchResponse saveHistoryByEntity(Users user, Long entityId, EntityType type, String keyword) {
        String normalized = normalize(keyword);
        if (entityId == null) return null;

        String entityName = null;
        switch (type) {
            case WORD -> {
                var vocab = vocabulariesRepository.findById(entityId)
                        .orElseThrow(() -> new AppException(ErrorCode.WORD_NOT_FOUND));
                entityName = vocab.getWord();
            }
            case KANJI -> {
                var kanji = kanjiRepository.findById(entityId)
                        .orElseThrow(() -> new AppException(ErrorCode.KANJI_NOT_FOUND));
                entityName = kanji.getCharacterName();
            }
            case GRAMMAR -> {
                var grammar = grammarRepository.findById(entityId)
                        .orElseThrow(() -> new AppException(ErrorCode.GRAMMAR_NOT_FOUND));
                entityName = grammar.getPattern();
            }
        }

        HistorySearch history = HistorySearch.builder()
                .user(user)
                .entityId(entityId)
                .entityType(type)
                .entityName(entityName)
                .keyword(normalized)
                .build();

        historySearchRepository.save(history);
        historySearchRepository.trimOldHistory(user.getId(), MAX_HISTORY_PER_USER);
        return historySearchMapper.toHistorySearchResponse(history);
    }

    @Override
    public Page<HistorySearch> getHistorySearch(Users user, Pageable pageable) {
        return historySearchRepository.findByUserOrderBySearchedAtDesc(user, pageable);
    }

    @Override
    @Transactional
    public void deleteAllByUser(Users user) {
        historySearchRepository.deleteByUser(user);
    }

    @Override
    @Transactional
    public void deleteByIdsForUser(List<Long> ids, Users user) {
        if (ids == null || ids.isEmpty()) return;
        historySearchRepository.deleteByIdInAndUser(ids, user);
    }
}
