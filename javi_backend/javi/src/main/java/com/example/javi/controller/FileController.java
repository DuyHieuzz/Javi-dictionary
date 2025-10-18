package com.example.javi.controller;

import java.io.IOException;
import java.net.URISyntaxException;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.service.FileService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/files")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class FileController {
    @NonFinal
    @Value("${javi.upload-file.base-uri}")
    String baseURI;

    FileService fileService;

    @PostMapping("/upload-avatar")
    public String upload(
            @RequestParam(name = "file", required = false) MultipartFile file, @RequestParam("folder") String folder)
            throws URISyntaxException, IOException {

        // tạo thư mục nếu không tồn tại
        this.fileService.createDirectory(baseURI + folder);

        // lưu file
        return this.fileService.store(file, folder);
    }
}
