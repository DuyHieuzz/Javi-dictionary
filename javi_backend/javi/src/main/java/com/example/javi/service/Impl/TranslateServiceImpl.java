package com.example.javi.service.Impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.javi.dto.response.TranslateResponse;
import com.example.javi.entity.Translation;
import com.example.javi.entity.Users;
import com.example.javi.mapper.TranslationMapper;
import com.example.javi.repository.TranslationRepository;
import com.example.javi.service.TranslateService;
import com.example.javi.utils.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TranslateServiceImpl implements TranslateService {
    TranslationRepository translationRepository;
    SecurityUtil securityUtil;
    TranslationMapper translationMapper;

    @Override
    public Page<TranslateResponse> getTranslations(Pageable pageable) {
        Users currentUser = securityUtil.getCurrentUser();
        Page<Translation> translations = translationRepository.findAllByUserOrderByCreatedAtDesc(currentUser, pageable);
        return translations.map(translationMapper::translationToTranslateResponse);
    }
}
