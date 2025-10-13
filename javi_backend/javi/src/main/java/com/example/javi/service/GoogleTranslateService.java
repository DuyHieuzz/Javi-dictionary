package com.example.javi.service;

import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.TranslateResponse;

public interface GoogleTranslateService {
    TranslateResponse translateWithGoogleTranslate(TranslateRequest translateRequest);

    TranslateResponse translateImage(MultipartFile multipartFile, String targetLang, String sourceLang);
}
