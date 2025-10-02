package com.example.javi.service;

import com.example.javi.dto.request.KanjiRequest;
import com.example.javi.dto.response.KanjiDetailResponse;
import com.example.javi.dto.response.KanjiResponse;
import com.example.javi.entity.Kanji;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public interface KanjiService {
    KanjiResponse createOrUpdateKanji(KanjiRequest kanjiRequest);
    void deleteKanjiByCharacterName(String characterName);
    KanjiDetailResponse getKanjiDetailByCharacterName(String characterName);
    List<KanjiResponse> getKanjiByKeyWord(String keyword);
    Page<Kanji> getAllKanjiByFilter(Specification<Kanji> spec, Pageable pageable);
}
