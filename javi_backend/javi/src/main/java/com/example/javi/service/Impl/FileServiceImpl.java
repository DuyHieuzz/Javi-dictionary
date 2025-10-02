package com.example.javi.service.Impl;

import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.service.FileService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.text.Normalizer;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
//@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class FileServiceImpl implements FileService {

    @Value("${javi.upload-file.base-uri}")
    private String baseURI;

    @Override
    @Transactional
    public void createDirectory(String folder) throws URISyntaxException {
        URI uri = new URI(folder);
        Path path = Paths.get(uri);
        File tmpDir = new File(path.toString());
        if (!tmpDir.isDirectory()) {
            try {
                Files.createDirectory(tmpDir.toPath());
                System.out.println(">>> CREATE NEW DIRECTORY SUCCESSFUL, PATH = " + tmpDir.toPath());
            } catch (IOException e) {
                e.printStackTrace();
            }
        } else {
            System.out.println(">>> SKIP MAKING DIRECTORY, ALREADY EXISTS");
        }
    }

    @Override
    @Transactional
    public String store(MultipartFile file, String folder) throws IOException, URISyntaxException {
        // Lấy tên file gốc

        // 1. Validate file rỗng
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_FILE);
        }

        // 2. Validate kích thước file (<= 10MB)
        long maxSize = 10 * 1024 * 1024; // 10MB
        if (file.getSize() > maxSize) {
            throw new AppException(ErrorCode.FILE_TOO_LARGE);
        }

        // 3. Validate loại file (MIME type + extension)
        List<String> allowedExtensions = Arrays.asList("jpg", "jpeg", "png", "pdf");
        List<String> allowedMimeTypes = Arrays.asList("image/jpeg", "image/png", "application/pdf");

        String fileName = file.getOriginalFilename();
        if (fileName == null || fileName.trim().isEmpty()) {
            throw new AppException(ErrorCode.INVALID_FILE_NAME);
        }

        // Lấy extension
        String extension = fileName.substring(fileName.lastIndexOf('.') + 1).toLowerCase();
        if (!allowedExtensions.contains(extension)) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        // Kiểm tra mime type
        String mimeType = file.getContentType();
        if (mimeType == null || !allowedMimeTypes.contains(mimeType)) {
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }
        // Chỉ lấy phần tên file (tránh path traversal)
        String cleanName = Paths.get(fileName).getFileName().toString();

        // Chuẩn hóa (Normalization Form D – tách dấu khỏi ký tự)
        cleanName = Normalizer.normalize(cleanName, Normalizer.Form.NFD);

        // Bỏ toàn bộ dấu tiếng Việt
        cleanName = cleanName.replaceAll("\\p{M}", "");

        // Loại bỏ ký tự lạ, chỉ giữ chữ/số/._-
        cleanName = cleanName.replaceAll("[^a-zA-Z0-9._-]", "_");

        // Tạo tên file duy nhất
        String finalName = System.currentTimeMillis() + "-" + cleanName;

        // Tạo đường dẫn lưu file
        URI uri = new URI(baseURI + folder + "/" + finalName);
        Path path = Paths.get(uri);
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, path, StandardCopyOption.REPLACE_EXISTING);
        }

        return finalName;
    }


}
