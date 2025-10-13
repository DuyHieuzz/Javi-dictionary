package com.example.javi.service.Impl;

import java.util.Base64;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
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

    @Value("${javi.max-size-image-translate}")
    long MAX_FILE_SIZE;

    @Override
    public String extractTextFromImage(MultipartFile imageFile) {
        try {
            //  Kiểm tra kích thước file
            if (imageFile.getSize() > MAX_FILE_SIZE) {
                throw new AppException(ErrorCode.IMAGE_TOO_LARGE);
            }

            //  Convert ảnh sang Base64
            String base64Image = Base64.getEncoder().encodeToString(imageFile.getBytes());
            String url = "https://vision.googleapis.com/v1/images:annotate?key=" + apiKey;

            //  Tạo body request
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

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(requestBody, headers);

            //  Gọi Google Vision API
            RestTemplate restTemplate = new RestTemplate();
            String response = restTemplate.postForObject(url, request, String.class);
            log.debug("Vision API raw response: {}", response);

            //  Trích xuất text
            String extractedText = JsonPath.read(response, "$.responses[0].fullTextAnnotation.text");
            if (extractedText == null || extractedText.trim().isEmpty()) {
                throw new AppException(ErrorCode.CANNOT_DETECTED_TEXT_IN_IMAGE);
            }

            return extractedText.trim();

        } catch (HttpClientErrorException e) {
            log.error("Vision API error: {}", e.getResponseBodyAsString());
            throw new AppException(ErrorCode.ERROR_TRANSLATION);
        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("OCR lỗi không xác định", e);
            throw new AppException(ErrorCode.CANNOT_DETECTED_TEXT_IN_IMAGE);
        }
    }
}
