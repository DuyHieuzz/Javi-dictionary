package com.example.javi.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.javi.dto.response.TranslateResponse;
import com.example.javi.entity.Users;

public interface TranslateService {
    Page<TranslateResponse> getTranslations(Pageable pageable);

    void deleteAllTranslationsByUser(Users user);

    void deleteTranslationsByIds(List<Long> ids, Users user);
}
