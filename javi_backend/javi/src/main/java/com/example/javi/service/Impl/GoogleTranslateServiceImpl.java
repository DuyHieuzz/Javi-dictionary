package com.example.javi.service.Impl;

import java.net.URI;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import com.example.javi.dto.request.TranslateRequest;
import com.example.javi.dto.response.TranslateResponse;
import com.example.javi.entity.Translation;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.TranslationMapper;
import com.example.javi.repository.TranslationRepository;
import com.example.javi.service.GoogleTranslateService;
import com.example.javi.service.OcrService;
import com.example.javi.utils.SecurityUtil;
import com.github.pemistahl.lingua.api.Language;
import com.github.pemistahl.lingua.api.LanguageDetector;
import com.github.pemistahl.lingua.api.LanguageDetectorBuilder;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GoogleTranslateServiceImpl implements GoogleTranslateService {
    RestTemplate restTemplate;
    OcrService ocrService;
    SecurityUtil securityUtil;
    TranslationMapper translationMapper;
    TranslationRepository translationRepository;

    @NonFinal
    @Value("${google.translate.base-url}")
    String BASE_URL;

    LanguageDetector detector = LanguageDetectorBuilder.fromLanguages(
                    Language.VIETNAMESE, Language.JAPANESE, Language.ENGLISH)
            .build();

    @Override
    public TranslateResponse translateWithGoogleTranslate(
            TranslateRequest translateRequest, Authentication authentication) {
        try {
            // Detect ngôn ngữ thật của đoạn text
            Language detectedLang = detector.detectLanguageOf(translateRequest.getSourceText());
            String detectedLangCode = detectedLang.getIsoCode639_1().toString(); // vd: "vi", "ja", "en"

            // Nếu user chọn sai ngôn ngữ thì tự sửa
            if (!detectedLangCode.equalsIgnoreCase(translateRequest.getSourceLang())) {
                log.info(
                        "Phát hiện ngôn ngữ thực tế là '{}', tự động sửa sourceLang từ '{}' → '{}'",
                        detectedLangCode,
                        translateRequest.getSourceLang(),
                        detectedLangCode);
                translateRequest.setSourceLang(detectedLangCode);
            }
            String encodedText = URLEncoder.encode(translateRequest.getSourceText(), StandardCharsets.UTF_8);
            // Xây URL gọi Google Translate Web API
            URI uri = UriComponentsBuilder.fromHttpUrl(BASE_URL)
                    .queryParam("client", "gtx")
                    .queryParam("sl", translateRequest.getSourceLang())
                    .queryParam("tl", translateRequest.getTargetLang())
                    .queryParam("dt", "t")
                    .queryParam("q", encodedText)
                    .build(true)
                    .toUri();

            log.info("Google Translate API URL: {}", uri);

            // Gọi API
            String response = restTemplate.getForObject(uri, String.class);
            log.info("Google Translate raw response: {}", response);

            if (response == null || !response.contains("\"")) {
                log.warn("Google Translate trả về null hoặc sai định dạng");
                throw new AppException(ErrorCode.ERROR_TRANSLATION);
            }

            // Trích text dịch
            String translatedText = response.split("\"")[1];
            if (authentication != null) {
                Users currentUser = securityUtil.getCurrentUser();
                Translation translation = translationMapper.toTranslation(translateRequest);
                translation.setUser(currentUser);
                translation.setTranslatedText(translatedText);
                translationRepository.save(translation);
            }
            TranslateResponse translateResponse = translationMapper.toTranslateResponse(translateRequest);
            translateResponse.setTranslatedText(translatedText);
            return translateResponse;

        } catch (Exception e) {
            log.error("Lỗi khi gọi GG API", e);
            throw new AppException(ErrorCode.ERROR_TRANSLATION);
        }
    }

    @Override
    public TranslateResponse translateImage(MultipartFile imageFile, String targetLang, Authentication authentication) {
        try {
            // OCR trích xuất chữ
            String detectedText = ocrService.extractTextFromImage(imageFile);
            if (detectedText == null || detectedText.isBlank()) {
                throw new AppException(ErrorCode.CANNOT_DETECTED_TEXT_IN_IMAGE);
            }

            // Detect ngôn ngữ thật
            Language detected = detector.detectLanguageOf(detectedText);
            String detectedLang = detected.getIsoCode639_1().toString();

            // Dịch văn bản
            TranslateRequest request = TranslateRequest.builder()
                    .sourceText(detectedText)
                    .sourceLang(detectedLang)
                    .targetLang(targetLang)
                    .build();

            TranslateResponse response = translateWithGoogleTranslate(request, authentication);

            return TranslateResponse.builder()
                    .sourceLang(detectedLang)
                    .targetLang(targetLang)
                    .sourceText(detectedText)
                    .translatedText(response != null ? response.getTranslatedText() : "Không thể dịch")
                    .build();

        } catch (Exception e) {
            log.error("Lỗi dịch ảnh", e);
            throw new AppException(ErrorCode.ERROR_TRANSLATION);
        }
    }
}
