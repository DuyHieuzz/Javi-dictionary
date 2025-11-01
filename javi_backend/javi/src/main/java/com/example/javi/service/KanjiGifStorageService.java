package com.example.javi.service;

import org.springframework.web.multipart.MultipartFile;

public interface KanjiGifStorageService {
    String uploadKanjiGif(MultipartFile file);

    void deleteKanjiGif(String url);
}
