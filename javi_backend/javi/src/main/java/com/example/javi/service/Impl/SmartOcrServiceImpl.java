package com.example.javi.service.Impl;

import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.service.OcrService;
import com.jayway.jsonpath.JsonPath;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE)
public class SmartOcrServiceImpl implements OcrService {

    @Value("${google.vision.api-key}")
    String apiKey;

    @Override
    public String extractTextFromImage(MultipartFile imageFile) {
        try {
            // Chuyển ảnh sang Base64
            String base64Image = Base64.getEncoder().encodeToString(imageFile.getBytes());
            String url = "https://vision.googleapis.com/v1/images:annotate?key=" + apiKey;

            // Request body
            String requestBody =
                    """
			{
			"requests": [
				{
				"image": {"content": "%s"},
				"features": [{"type": "TEXT_DETECTION"}]
				}
			]
			}
			"""
                            .formatted(base64Image);

            // Gọi API Google Vision
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

            String response = restTemplate.postForObject(url, request, String.class);
            log.info("Google Vision API raw response: {}", response);

            // Trích text
            String extractedText = JsonPath.read(response, "$.responses[0].fullTextAnnotation.text");
            log.info("OCR Result: {}", extractedText);

            if (extractedText == null || extractedText.trim().isEmpty()) {
                throw new AppException(ErrorCode.CANNOT_DETECTED_TEXT_IN_IMAGE);
            }

            return extractedText.trim();

        } catch (Exception e) {
            log.error("Lỗi khi gọi Google Vision API", e);
            throw new AppException(ErrorCode.CANNOT_DETECTED_TEXT_IN_IMAGE);
        }
    }
}
