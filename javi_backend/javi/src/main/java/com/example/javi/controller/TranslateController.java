package com.example.javi.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.TranslateResponse;
import com.example.javi.entity.EngineType;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.service.GeminiService;
import com.example.javi.service.GoogleTranslateService;
import com.example.javi.service.TranslateService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/translate")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class TranslateController {
    GoogleTranslateService googleTranslateService;
    GeminiService geminiService;
    TranslateService translateService;

    @PostMapping("")
    public ApiResponse<TranslateResponse> translateText(@Valid @RequestBody TranslateRequest request) {

        // Chuyển String engine sang Enum (type-safe)
        EngineType engine;
        try {
            engine = EngineType.valueOf(request.getEngine().toUpperCase());
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_ENGINE);
        }

        TranslateResponse response =
                switch (engine) {
                    case GOOGLE -> googleTranslateService.translateWithGoogleTranslate(request);
                    case AI -> geminiService.translateText(request);
                };

        return ApiResponse.<TranslateResponse>builder()
                .message("Dịch thành công")
                .result(response)
                .build();
    }

    @PostMapping("/image")
    public ApiResponse<TranslateResponse> translateImage(
            @RequestParam("file") MultipartFile file,
            @RequestParam(defaultValue = "vi") String targetLang,
            @RequestParam(value = "sourceLang", required = false) String sourceLang,
            @RequestParam(value = "engine", defaultValue = "GOOGLE") String engineStr) {

        EngineType engine;
        try {
            engine = EngineType.valueOf(engineStr.toUpperCase());
        } catch (Exception e) {
            throw new AppException(ErrorCode.INVALID_ENGINE);
        }

        TranslateResponse response =
                switch (engine) {
                    case AI -> geminiService.translateImage(file, targetLang, sourceLang);
                    case GOOGLE -> googleTranslateService.translateImage(file, targetLang, sourceLang);
                };

        return ApiResponse.<TranslateResponse>builder()
                .message("Dịch thành công")
                .result(response)
                .build();
    }

    @GetMapping("/history")
    public ApiResponse<Page<TranslateResponse>> translateHistory(
            @PageableDefault(
                            size = 10,
                            sort = "createdAt",
                            direction = org.springframework.data.domain.Sort.Direction.DESC)
                    Pageable pageable) {

        Page<TranslateResponse> history = translateService.getTranslations(pageable);

        return ApiResponse.<Page<TranslateResponse>>builder()
                .message("Lấy lịch sử dịch thành công")
                .result(history)
                .build();
    }
}
