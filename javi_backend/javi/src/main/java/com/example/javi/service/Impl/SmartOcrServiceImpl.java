package com.example.javi.service.Impl;

import java.util.Arrays;
import java.util.Base64;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    // Regex đơn giản để phát hiện ký tự tiếng Nhật (Kanji / Hiragana / Katakana)
    private static final Pattern JAPANESE_CHAR = Pattern.compile("[\\p{IsHan}\\p{IsHiragana}\\p{IsKatakana}]");

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

            //  Trích xuất text (dùng JsonPath, có thể ném exception nếu path ko tồn tại)
            String extractedText = null;
            try {
                extractedText = JsonPath.read(response, "$.responses[0].fullTextAnnotation.text");
            } catch (Exception ex) {
                // Nếu không có fullTextAnnotation, giữ extractedText = null để xử lý dưới
                log.debug("Không tìm thấy fullTextAnnotation.text trong response Vision API");
            }

            if (extractedText == null || extractedText.trim().isEmpty()) {
                throw new AppException(ErrorCode.CANNOT_DETECTED_TEXT_IN_IMAGE);
            }

            // Normalize / reflow text: nối các dòng bị ngắt giữa câu, nhưng giữ bullet/numbered lines
            String normalized = normalizeOcrText(extractedText);

            if (normalized == null || normalized.trim().isEmpty()) {
                throw new AppException(ErrorCode.CANNOT_DETECTED_TEXT_IN_IMAGE);
            }

            return normalized.trim();

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

    /**
     * Normalize OCR result: loại bỏ các ký tự xuống dòng lạc chỗ, chỉnh lại dòng trong một đoạn văn.
     * - Giữ paragraph break (double newline) nhưng nối các dòng bị tách giữa câu.
     * - Với tiếng Nhật: nối trực tiếp (không chèn space).
     * - Với ngôn ngữ có space (Latin): chèn space khi nối.
     * - DÒNG BULLET / NUMBERED (ví dụ "・", "-", "•", "●", "*", "·", "1.") -> giữ nguyên một dòng riêng.
     */
    private String normalizeOcrText(String raw) {
        if (raw == null) return "";

        // Chuẩn hóa newline
        String s = raw.replace("\r\n", "\n").replace("\r", "\n");

        // Phát hiện xem có ký tự tiếng Nhật hay không (để quyết định có chèn space khi nối)
        boolean isJapanese = JAPANESE_CHAR.matcher(s).find();

        // Tách paragraph (giữ paragraph cách nhau bởi 1 dòng trống)
        String[] paragraphs = s.split("\\n\\s*\\n");

        return Arrays.stream(paragraphs)
                .map(p -> normalizeParagraph(p, isJapanese))
                .filter(str -> !str.isEmpty())
                .collect(Collectors.joining("\n\n")) // giữ paragraph break
                .trim();
    }

    /**
     * Normalize từng paragraph:
     * - Nối các dòng break do OCR (wrap) vào cùng 1 dòng theo ngôn ngữ.
     * - Nếu gặp dòng bullet/numbered thì giữ nguyên 1 dòng (không nối nó vào dòng trước).
     */
    private String normalizeParagraph(String paragraph, boolean isJapanese) {
        // tách theo dòng, trim, bỏ dòng rỗng
        String[] lines = Arrays.stream(paragraph.split("\\n"))
                .map(String::trim)
                .filter(l -> !l.isEmpty())
                .toArray(String[]::new);

        if (lines.length == 0) return "";

        StringBuilder out = new StringBuilder();

        for (int i = 0; i < lines.length; i++) {
            String line = lines[i];

            // Kiểm tra dòng hiện tại có phải bullet/numbered line không
            if (isBulletOrNumberedLine(line)) {
                // Nếu là dòng đầu tiên trong paragraph -> append trực tiếp
                if (out.length() == 0) {
                    out.append(line);
                } else {
                    // Giữ bullet trên dòng riêng trong paragraph
                    out.append("\n").append(line);
                }
                continue;
            }

            if (i == 0) {
                out.append(line);
                continue;
            }

            // Nếu line trước kết thúc bằng dấu gạch nối (hyphenation), bỏ dấu này và nối
            int lastIdx = out.length() - 1;
            if (lastIdx >= 0 && out.charAt(lastIdx) == '-') {
                out.deleteCharAt(lastIdx);
                out.append(line);
                continue;
            }

            // Kiểm tra xem line trước có kết thúc bằng dấu chấm câu (JP hoặc Latin)
            boolean prevEndsWithSentencePunct = out.toString().matches(".*[。．…！？.!?]$");

            if (prevEndsWithSentencePunct) {
                // Nếu dòng trước kết thúc bằng dấu chấm câu -> coi là kết thúc câu/khả năng ngắt đoạn
                // Không nối vào cùng 1 dòng; tạo newline trước dòng mới.
                // Nếu bạn muốn tách mạnh hơn thành paragraph break, đổi "\n" thành "\n\n".
                out.append("\n").append(line);
            } else {
                // prev không kết thúc bằng dấu câu -> rất có thể OCR tách giữa câu -> nối liền
                if (isJapanese) {
                    out.append(line);
                } else {
                    out.append(" ").append(line);
                }
            }
        }

        return out.toString();
    }

    /**
     * Xác định bullet/numbered line:
     * - Bắt đầu bằng ký tự bullet phổ biến: ・ - • ● * ·
     * - Hoặc bắt đầu bằng pattern số theo sau dấu chấm: "1. " "2. "
     */
    private boolean isBulletOrNumberedLine(String line) {
        if (line == null || line.isEmpty()) return false;
        String trimmed = line.trim();

        // Các ký tự liệt kê/bullet đơn phổ biến (mở rộng với en-dash, em-dash, ※, circled numbers...)
        char first = trimmed.charAt(0);
        if (first == '・'
                || first == '-'
                || first == '–'
                || first == '—'
                || first == '•'
                || first == '●'
                || first == '*'
                || first == '·'
                || first == '※'
                || first == '①'
                || first == '②'
                || first == '③') {
            return true;
        }

        // fullwidth parentheses numbered: （1） / （2）
        if (trimmed.matches("^（?\\d+）.*")) {
            return true;
        }

        // numbered like: 1. 2. 10.
        if (trimmed.matches("^\\d+\\.\\s+.*")) {
            return true;
        }

        // circled numbers (Unicode) - ví dụ ①..⑳ (optional broader check)
        if (trimmed.matches("^[\\u2460-\\u2473].*")) {
            return true;
        }

        return false;
    }
}
