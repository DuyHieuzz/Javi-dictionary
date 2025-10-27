package com.example.javi.service;

import java.io.File;
import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;

public interface AvatarStorageService {
    String uploadAvatar(MultipartFile file);

    void deleteAvatar(String url);

    File compressImage(MultipartFile file) throws IOException;
}
