package com.example.javi.service;

import org.springframework.web.multipart.MultipartFile;

public interface OcrService {
    String extractTextFromImage(MultipartFile imageFile);
}
