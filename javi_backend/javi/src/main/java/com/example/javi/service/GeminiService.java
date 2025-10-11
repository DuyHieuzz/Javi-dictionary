package com.example.javi.service;

import org.springframework.security.core.Authentication;

import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.TranslateResponse;

public interface GeminiService {
    TranslateResponse translateText(TranslateRequest request, Authentication authentication);

    String explainWord(String word);
}
