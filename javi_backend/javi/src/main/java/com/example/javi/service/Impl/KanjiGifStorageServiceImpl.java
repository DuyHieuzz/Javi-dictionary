package com.example.javi.service.Impl;

import java.io.*;
import java.text.Normalizer;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.service.KanjiGifStorageService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class KanjiGifStorageServiceImpl implements KanjiGifStorageService {

    S3Client r2Client;

    @NonFinal
    @Value("${cloudflare.r2.bucket}")
    String bucket;

    @NonFinal
    @Value("${cloudflare.r2.public-base-url}")
    String publicBaseUrl;

    @NonFinal
    @Value("${javi.max-kanji-gif-size}")
    long maxKanjiGifSize;

    /**
     * Upload ảnh GIF viết nét Kanji lên Cloudflare R2.
     * - Chỉ chấp nhận file .gif (image/gif)
     * - Không nén, giữ nguyên animation
     * - Tự động chuẩn hóa tên file và sinh key duy nhất
     * - Trả về URL public CDN
     */
    public String uploadKanjiGif(MultipartFile file) {
        // Kiểm tra file rỗng
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_FILE);
        }

        // Validate loại file
        String contentType = file.getContentType();
        List<String> allowedTypes = List.of("image/gif");

        if (contentType == null || !allowedTypes.contains(contentType)) {
            log.warn("[KANJI GIF] Loại file không hợp lệ: {}", contentType);
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        // Validate dung lượng
        if (file.getSize() > maxKanjiGifSize) {
            throw new AppException(ErrorCode.IMAGE_GIF_TOO_LARGE);
        }

        try {
            // Chuẩn hóa tên file
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "kanji.gif";
            String sanitizedName = Normalizer.normalize(originalName, Normalizer.Form.NFD)
                    .replaceAll("[^\\p{ASCII}]", "") // bỏ dấu tiếng Việt
                    .replaceAll("\\s+", "_") // khoảng trắng -> _
                    .replaceAll("[^a-zA-Z0-9._-]", ""); // bỏ ký tự đặc biệt

            if (sanitizedName.isEmpty()) {
                throw new AppException(ErrorCode.INVALID_FILE_NAME);
            }

            // Bảo đảm có đuôi .gif
            if (!sanitizedName.toLowerCase().endsWith(".gif")) {
                sanitizedName = sanitizedName + ".gif";
            }

            // Sinh key duy nhất
            String key = "kanji_gif/" + UUID.randomUUID() + "-" + sanitizedName;

            // Upload lên Cloudflare R2
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType("image/gif")
                    .build();

            try (InputStream inputStream = file.getInputStream()) {
                r2Client.putObject(
                        putRequest,
                        software.amazon.awssdk.core.sync.RequestBody.fromInputStream(inputStream, file.getSize()));
            }

            log.info("[R2 UPLOAD] Kanji GIF uploaded successfully: {}", key);
            return publicBaseUrl + "/" + key;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("[R2 ERROR] Upload Kanji GIF thất bại: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_KEY);
        }
    }

    /**
     * Xóa ảnh GIF cũ khi cập nhật Kanji mới.
     */
    public void deleteKanjiGif(String url) {
        if (url == null || !url.contains("kanji_gif/")) return;
        try {
            // Lấy phần key từ URL (bắt đầu từ "kanji_gif/")
            String key = url.substring(url.indexOf("kanji_gif/"));

            // Nếu URL có query string (ví dụ ?token=abc hoặc ?ts=12345)
            // thì cần cắt bỏ phần sau dấu '?', vì R2 chỉ nhận key gốc.
            int qIndex = key.indexOf('?');
            if (qIndex >= 0) {
                key = key.substring(0, qIndex);
            }

            // Gửi yêu cầu xóa object trên R2
            DeleteObjectRequest deleteRequest =
                    DeleteObjectRequest.builder().bucket(bucket).key(key).build();

            r2Client.deleteObject(deleteRequest);
            log.info("[R2 DELETE] Đã xóa ảnh Kanji GIF cũ: {}", key);
        } catch (Exception e) {
            log.warn("[R2 WARN] Không thể xóa ảnh Kanji GIF cũ: {}", e.getMessage());
        }
    }
}
