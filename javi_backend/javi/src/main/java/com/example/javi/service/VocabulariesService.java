package com.example.javi.service;

import com.example.javi.dto.request.VocabRequest;
import com.example.javi.dto.request.VocabUpdateDTO;
import com.example.javi.dto.response.VocabUpdateResponse;
import com.example.javi.entity.Vocabularies;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import java.util.List;

public interface VocabulariesService {
    String createVocabulary(VocabRequest request);

    VocabUpdateResponse updateVocabulary(Long id, VocabUpdateDTO request);

    List<Vocabularies> searchVocabularies(String keyword);

    Vocabularies getVocabularyByWord(String word);

    Vocabularies getVocabularyById(Long id);

    Page<Vocabularies> getAllVocabulariesByFilter(Specification<Vocabularies> spec, Pageable pageable);

    void deleteVocabularyById(Long id);
}
