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
import com.example.javi.service.AvatarStorageService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AvatarStorageServiceImpl implements AvatarStorageService {

    S3Client r2Client;

    @NonFinal
    @Value("${cloudflare.r2.bucket}")
    String bucket;

    @NonFinal
    @Value("${cloudflare.r2.public-base-url}")
    String publicBaseUrl;

    @NonFinal
    @Value("${javi.max-avatar-size}")
    long maxAvatarSize;

    @Override
    public String uploadAvatar(MultipartFile file) {
        // Kiểm tra file rỗng
        if (file == null || file.isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_FILE);
        }

        // Validate định dạng file
        String contentType = file.getContentType();
        List<String> allowedTypes = List.of("image/jpeg", "image/png", "image/jpg");

        if (contentType == null || !allowedTypes.contains(contentType)) {
            log.warn("Loại file không hợp lệ: {}", contentType);
            throw new AppException(ErrorCode.INVALID_FILE_TYPE);
        }

        // Validate dung lượng
        if (file.getSize() > maxAvatarSize) {
            throw new AppException(ErrorCode.IMAGE_TOO_LARGE);
        }

        File compressed = null;
        try {
            // Nén ảnh tạm
            compressed = compressImage(file);

            // Chuẩn hóa tên file
            String originalName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "avatar.jpg";
            String sanitizedName = Normalizer.normalize(originalName, Normalizer.Form.NFD)
                    .replaceAll("[^\\p{ASCII}]", "") // bỏ dấu tiếng Việt
                    .replaceAll("\\s+", "_") // khoảng trắng -> _
                    .replaceAll("[^a-zA-Z0-9._-]", ""); // bỏ ký tự đặc biệt

            // Nếu tên file sau xử lý quá ngắn → coi như invalid
            if (sanitizedName.length() < 3) {
                throw new AppException(ErrorCode.INVALID_FILE_NAME);
            }

            // Tạo key duy nhất
            String key = "avatars/" + UUID.randomUUID() + "-" + sanitizedName;

            // Upload lên Cloudflare R2
            PutObjectRequest putRequest = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            try (InputStream inputStream = new FileInputStream(compressed)) {
                r2Client.putObject(
                        putRequest,
                        software.amazon.awssdk.core.sync.RequestBody.fromInputStream(inputStream, compressed.length()));
            }

            log.info(" Uploaded avatar to R2: {}", key);
            return publicBaseUrl + "/" + key;

        } catch (AppException e) {
            throw e;
        } catch (Exception e) {
            log.error("Upload avatar thất bại: {}", e.getMessage());
            throw new AppException(ErrorCode.INVALID_KEY);

        } finally {
            // Xóa file tạm an toàn
            if (compressed != null && compressed.exists() && compressed.delete()) {
                log.debug("Đã xóa file tạm: {}", compressed.getName());
            }
        }
    }

    /**
     * Xóa avatar cũ khi user update
     */
    @Override
    public void deleteAvatar(String url) {
        if (url == null || !url.contains("avatars/")) return;
        try {
            String key = url.substring(url.indexOf("avatars/"));
            DeleteObjectRequest deleteRequest =
                    DeleteObjectRequest.builder().bucket(bucket).key(key).build();
            r2Client.deleteObject(deleteRequest);
            log.info("Đã xóa ảnh cũ: {}", key);
        } catch (Exception e) {
            log.warn("Không thể xóa ảnh cũ: {}", e.getMessage());
        }
    }

    /**
     * Nén ảnh trước khi upload (max 512x512, giữ tỉ lệ, chất lượng 0.8)
     */
    public File compressImage(MultipartFile file) throws IOException {
        File temp = File.createTempFile("avatar-", ".jpg");
        try (InputStream in = file.getInputStream();
                OutputStream out = new FileOutputStream(temp)) {
            Thumbnails.of(in).size(512, 512).outputQuality(0.8).toOutputStream(out);
        }
        return temp;
    }
}
