package com.example.javi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.javi.dto.response.TranslateResponse;

public interface TranslateService {
    Page<TranslateResponse> getTranslations(Pageable pageable);
}
