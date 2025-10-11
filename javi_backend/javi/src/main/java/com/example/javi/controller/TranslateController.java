package com.example.javi.controller;

import jakarta.validation.Valid;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.TranslateResponse;
import com.example.javi.service.GeminiService;
import com.example.javi.service.GoogleTranslateService;

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

    @PostMapping("")
    public ApiResponse translateWithGoogleTranslate(
            @Valid @RequestBody TranslateRequest translateRequest, Authentication authentication) {

        TranslateResponse translateResponse = new TranslateResponse();
        if (translateRequest.getEngin().equals("GOOGLE")) {
            translateResponse = googleTranslateService.translateWithGoogleTranslate(translateRequest, authentication);
        }
        if (translateRequest.getEngin().equals("AI")) {
            translateResponse = geminiService.translateText(translateRequest, authentication);
        }

        return ApiResponse.builder()
                .message("Dịch thành công")
                .result(translateResponse)
                .build();
    }

    // Chưa hoàn thành
    //    @PostMapping("/image")
    //    public ApiResponse translateImage(
    //            @RequestParam("file") MultipartFile file,
    //            @RequestParam(defaultValue = "vi") String targetLang,
    //            Authentication authentication) {
    //        TranslateResponse translateResponse = googleTranslateService.translateImage(file, targetLang,
    // authentication);
    //        return ApiResponse.builder()
    //                .message("Dịch thành công")
    //                .result(translateResponse)
    //                .build();
    //    }
}
