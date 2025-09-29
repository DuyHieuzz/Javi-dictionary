package com.example.javi.controller;

import com.example.javi.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URISyntaxException;

@RestController
@RequestMapping("${api.prefix}/files")
@RequiredArgsConstructor
//@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class FileController {
    @Value("${javi.upload-file.base-uri}")
    String baseURI;

    private final FileService fileService;

    @PostMapping("/upload-avatar")
    public String upload(
            @RequestParam(name = "file", required = false) MultipartFile file,
            @RequestParam("folder") String folder
    ) throws URISyntaxException, IOException {

        // tạo thư mục nếu không tồn tại
        this.fileService.createDirectory(baseURI + folder);

        // lưu file
        return this.fileService.store(file, folder);
    }

}
