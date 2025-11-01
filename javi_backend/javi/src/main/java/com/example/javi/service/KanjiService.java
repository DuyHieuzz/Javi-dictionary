package com.example.javi.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.request.KanjiRequest;
import com.example.javi.dto.response.KanjiDecompositionResult;
import com.example.javi.dto.response.KanjiDetailResponse;
import com.example.javi.dto.response.KanjiResponse;
import com.example.javi.entity.Kanji;

public interface KanjiService {
    KanjiResponse createOrUpdateKanji(KanjiRequest kanjiRequest);

    void deleteKanjiByCharacterName(String characterName);

    KanjiDetailResponse getKanjiDetailByCharacterName(String characterName);

    List<KanjiResponse> getKanjiByKeyWord(String keyword);

    Page<KanjiResponse> getAllKanjiByFilter(Specification<Kanji> spec, Pageable pageable, String filter);

    KanjiResponse updateKanjiGif(MultipartFile file, String characterName);

    KanjiDecompositionResult analyzeKanji(String character);
}
