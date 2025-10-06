package com.example.javi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.javi.dto.request.CreateGrammarRequest;
import com.example.javi.dto.request.GrammarSearchRequest;
import com.example.javi.dto.request.UpdateGrammarRequest;
import com.example.javi.dto.response.GrammarResponse;

public interface GrammarService {
    GrammarResponse createGrammar(CreateGrammarRequest request);

    GrammarResponse updateGrammar(Long id, UpdateGrammarRequest request);

    void deleteGrammar(Long id);

    GrammarResponse getGrammarById(Long id);

    Page<GrammarResponse> searchGrammars(GrammarSearchRequest request, Pageable pageable);
}
