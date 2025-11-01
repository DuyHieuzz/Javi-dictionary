package com.example.javi.service;

import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.request.GrammarCheckSourceText;
import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.GrammarCheckResult;
import com.example.javi.dto.response.KanjiDecompositionResult;
import com.example.javi.dto.response.TranslateResponse;

public interface GeminiService {
    TranslateResponse translateText(TranslateRequest request);

    TranslateResponse translateImage(MultipartFile file, String targetLang, String sourceLang);

    String explainWord(String word);

    GrammarCheckResult checkGrammar(GrammarCheckSourceText request);

    KanjiDecompositionResult analyzeKanjiStructure(String kanji);
}
