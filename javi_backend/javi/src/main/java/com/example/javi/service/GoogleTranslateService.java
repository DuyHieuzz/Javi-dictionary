package com.example.javi.service;

import org.springframework.security.core.Authentication;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.TranslateResponse;

public interface GoogleTranslateService {
    TranslateResponse translateWithGoogleTranslate(TranslateRequest translateRequest, Authentication authentication);

    TranslateResponse translateImage(MultipartFile multipartFile, String targetLanguage, Authentication authentication);
}
