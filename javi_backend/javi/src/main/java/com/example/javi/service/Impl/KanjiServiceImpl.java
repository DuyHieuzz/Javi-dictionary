package com.example.javi.service.Impl;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.request.KanjiRequest;
import com.example.javi.dto.response.KanjiDecompositionResult;
import com.example.javi.dto.response.KanjiDetailResponse;
import com.example.javi.dto.response.KanjiResponse;
import com.example.javi.entity.Kanji;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.KanjiMapper;
import com.example.javi.repository.KanjiRepository;
import com.example.javi.repository.VocabulariesRepository;
import com.example.javi.service.GeminiService;
import com.example.javi.service.KanjiGifStorageService;
import com.example.javi.service.KanjiService;
import com.example.javi.service.cache.KanjiCacheService;
import com.example.javi.utils.ValidationUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class KanjiServiceImpl implements KanjiService {
    KanjiRepository kanjiRepository;
    KanjiMapper kanjiMapper;
    VocabulariesRepository vocabulariesRepository;
    KanjiCacheService kanjiCacheService;
    ObjectMapper objectMapper;
    GeminiService geminiService;
    KanjiGifStorageService kanjiGifStorageService;
    RestTemplate restTemplate = new RestTemplate();
    static String BASE_URL_KANJI_ALIVE = "https://app.kanjialive.com/api/kanji/";
    static String BASE_URL_KANJI_API = "https://kanjiapi.dev/v1/kanji/";

    @Override
    @Transactional
    public KanjiResponse createOrUpdateKanji(KanjiRequest kanjiRequest) {
        String character = kanjiRequest.getCharacterName();
        if (character == null || character.trim().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_KANJI);
        }

        Optional<Kanji> existingKanji = kanjiRepository.findByCharacterName(character);

        // Chuẩn hoá Hán Việt
        if (kanjiRequest.getSinoViName() != null
                && !kanjiRequest.getSinoViName().isBlank()) {
            String s = Normalizer.normalize(kanjiRequest.getSinoViName().trim(), Normalizer.Form.NFC)
                    .toUpperCase(Locale.forLanguageTag("vi"));
            kanjiRequest.setSinoViName(s);
        }

        Kanji savedKanji;
        if (existingKanji.isPresent()) {
            // Cập nhật nếu đã tồn tại
            Kanji kanji = existingKanji.get();
            kanjiMapper.updateKanjiFromDTO(kanjiRequest, kanji);
            savedKanji = kanjiRepository.save(kanji);
            log.info("[KANJI UPDATE] {}", character);
        } else {
            // Tạo mới nếu chưa tồn tại
            Kanji newKanji = kanjiMapper.toKanji(kanjiRequest);
            savedKanji = kanjiRepository.save(newKanji);
            log.info("[KANJI CREATE] {}", character);
        }

        // Đồng bộ cache sau khi tạo hoặc cập nhật
        try {
            kanjiCacheService.deleteKanjiDetail(character);
            kanjiCacheService.clearAllPages();
            kanjiCacheService.clearAllKeywordCache();
            log.info("[REDIS CLEAR] Đã xóa cache sau khi tạo/cập nhật Kanji {}", character);
        } catch (Exception e) {
            log.error("[REDIS ERROR] Đã xóa cache sau khi lưu tạo/cập nhật thất bại với kanji {}", e.getMessage());
        }

        return kanjiMapper.toKanjiResponse(savedKanji);
    }

    @Override
    @Transactional
    public void deleteKanjiByCharacterName(String characterName) {
        characterName = characterName.trim();
        if (characterName.isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_KANJI);
        }
        Kanji existingKanji = kanjiRepository
                .findByCharacterName(characterName)
                .orElseThrow(() -> new AppException(ErrorCode.KANJI_NOT_FOUND));
        // Nếu kanji còn liên kết từ vựng khác -> ném ra lỗi báo kanji còn được sử dụng
        if (existingKanji.getVocabularies() != null
                && !existingKanji.getVocabularies().isEmpty()) {
            throw new AppException(ErrorCode.KANJI_STILL_IN_USE);
        }

        String oldUrl = existingKanji.getGifUrl();

        kanjiRepository.deleteKanjiByCharacterName(characterName);

        if (oldUrl != null && !oldUrl.isBlank()) {
            try {
                kanjiGifStorageService.deleteKanjiGif(oldUrl);
            } catch (Exception ignored) {
            }
        }
        // logic xóa cache
        kanjiCacheService.clearAllPages();
        kanjiCacheService.clearAllKeywordCache();
        kanjiCacheService.deleteKanjiDetail(characterName);
    }

    @Override
    public KanjiDetailResponse getKanjiDetailByCharacterName(String kanjiChar) {
        if (kanjiChar == null || kanjiChar.trim().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_KANJI);
        }

        // Check cache
        KanjiDetailResponse cached = kanjiCacheService.getKanjiDetail(kanjiChar);
        if (cached != null) {
            log.info("[CACHE HIT] Kanji detail {}", kanjiChar);
            return cached;
        }
        log.info("[CACHE MISS] Vào DB tìm kanji: {}", kanjiChar);

        Kanji existingKanji = kanjiRepository
                .findByCharacterName(kanjiChar)
                .orElseThrow(() -> new AppException(ErrorCode.KANJI_NOT_FOUND));
        KanjiDetailResponse kanjiDetailResponse = kanjiMapper.toKanjiDetailResponse(existingKanji);

        // Do kanji alive không đầy đủ kanji nên rủi ro -> kết hợp call 2 api (kanji alive có mp4, kanji api không có
        // mp4 nhưng đủ kanji)
        try {
            // KANJI ALIVE để lấy video mp4 vẽ kanji, không có thì không có vẽ
            String kanjiAliveUrl = BASE_URL_KANJI_ALIVE + kanjiChar;
            String kanjiAliveJson = restTemplate.getForObject(kanjiAliveUrl, String.class);

            JsonNode kanjiAlive = objectMapper.readTree(kanjiAliveJson);
            kanjiDetailResponse.setVideoUrl(kanjiAlive.path("mp4_video_source").asText(""));

            // KANJI API để lấy các trường onyomi, kunyomi, stroke
            String kanjiApiUrl = BASE_URL_KANJI_API + kanjiChar;
            String kanjiApiJson = restTemplate.getForObject(kanjiApiUrl, String.class);
            JsonNode kanjiApi = objectMapper.readTree(kanjiApiJson);
            List<String> onReadings =
                    objectMapper.convertValue(kanjiApi.get("on_readings"), new TypeReference<List<String>>() {});
            List<String> kunReadings =
                    objectMapper.convertValue(kanjiApi.get("kun_readings"), new TypeReference<List<String>>() {});
            Integer stroke = kanjiApi.get("stroke_count").asInt();
            kanjiDetailResponse.setOnyomi(onReadings);
            kanjiDetailResponse.setKunyomi(kunReadings);
            kanjiDetailResponse.setStroke(stroke);

        } catch (Exception e) {
            log.error("Error fetching kanji data from external API", e);
        }
        // Lưu cache
        kanjiCacheService.saveKanjiDetail(kanjiChar, kanjiDetailResponse);
        log.info("[CACHE SAVE] Kanji detail:{}", kanjiChar);

        return kanjiDetailResponse;
    }

    @Override
    public List<KanjiResponse> getKanjiByKeyWord(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_KANJI);
        }

        String q = keyword.trim().toUpperCase();
        List<KanjiResponse> results = new ArrayList<>();

        // Kiểm tra cache trước
        List<KanjiResponse> cached = kanjiCacheService.getKanjiByKeyword(q);
        if (cached != null && !cached.isEmpty()) {
            log.info("[CACHE HIT] Kanji keyword '{}'", q);
            return cached;
        }

        log.info("[CACHE MISS] Kanji keyword '{}'", q);

        // Một chữ Kanji duy nhất (ví dụ: 学)
        if (ValidationUtils.isSingleKanji(q)) {
            kanjiRepository
                    .findByCharacterName(q)
                    .map(kanjiMapper::toKanjiResponse)
                    .ifPresent(results::add);

            if (!results.isEmpty()) {
                kanjiCacheService.saveKanjiByKeyword(q, results);
            }
            return results;
        }

        // Chuỗi toàn Kanji (ví dụ: 勉強)
        if (ValidationUtils.isAllKanji(q)) {
            for (String ch : ValidationUtils.extractKanjiChars(q)) {
                kanjiRepository
                        .findByCharacterName(ch)
                        .map(kanjiMapper::toKanjiResponse)
                        .ifPresent(results::add);
            }
            if (!results.isEmpty()) {
                kanjiCacheService.saveKanjiByKeyword(q, results);
                return results;
            }
        }

        // Chuỗi chứa Kana (ví dụ: 食べる, 勉強する)
        if (ValidationUtils.containsKana(q)) {
            vocabulariesRepository.findByWord(q).ifPresent(vocab -> vocab.getKanjis()
                    .forEach(k -> results.add(kanjiMapper.toKanjiResponse(k))));

            if (!results.isEmpty()) {
                kanjiCacheService.saveKanjiByKeyword(q, results);
                return results;
            }

            // Fallback: tách ra từng ký tự kanji trong chuỗi
            for (String ch : ValidationUtils.extractKanjiChars(q)) {
                kanjiRepository
                        .findByCharacterName(ch)
                        .map(kanjiMapper::toKanjiResponse)
                        .ifPresent(results::add);
            }
            if (!results.isEmpty()) {
                kanjiCacheService.saveKanjiByKeyword(q, results);
                return results;
            }
        }

        // Fallback cuối cùng: tìm theo Hán Việt (Sino-Vi)
        results.addAll(kanjiRepository.findBySinoViNameContainingIgnoreCase(q).stream()
                .map(kanjiMapper::toKanjiResponse)
                .toList());

        // Lưu cache nếu có kết quả
        if (!results.isEmpty()) {
            kanjiCacheService.saveKanjiByKeyword(q, results);
        }
        return results;
    }

    @Override
    public Page<KanjiResponse> getAllKanjiByFilter(Specification<Kanji> spec, Pageable pageable, String filter) {
        String filterKey = (filter != null && !filter.isBlank()) ? filter.trim() : "no-filter";

        // Hash đúng chuỗi filter gốc, không dựa vào spec.toString()
        String filterHash = DigestUtils.md5DigestAsHex(filterKey.getBytes());

        String cacheKey =
                String.format("kanji:page:%s:%d:%d", filterHash, pageable.getPageNumber(), pageable.getPageSize());

        Page<KanjiResponse> cached = kanjiCacheService.getPage(cacheKey);
        if (cached != null) {
            log.info("[CACHE HIT] key={} (filter='{}')", cacheKey, filterKey);
            return cached;
        }

        Page<Kanji> page = kanjiRepository.findAll(spec, pageable);
        Page<KanjiResponse> responsePage = page.map(kanjiMapper::toKanjiResponse);

        kanjiCacheService.savePage(cacheKey, responsePage);
        log.info("[CACHE SAVE] key={} (filter='{}')", cacheKey, filterKey);
        return responsePage;
    }

    @Override
    @Transactional
    public KanjiResponse updateKanjiGif(MultipartFile file, String characterName) {
        if (characterName == null || characterName.trim().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_KANJI);
        }

        Kanji kanji = kanjiRepository
                .findByCharacterName(characterName.trim())
                .orElseThrow(() -> new AppException(ErrorCode.KANJI_NOT_FOUND));

        String oldUrl = kanji.getGifUrl();
        String newUrl;

        // Upload ảnh mới lên R2
        newUrl = kanjiGifStorageService.uploadKanjiGif(file);

        try {
            // Cập nhật DB
            kanji.setGifUrl(newUrl);
            kanjiRepository.save(kanji);
        } catch (RuntimeException ex) {
            // Nếu DB lưu thất bại → xóa file mới để tránh rác
            kanjiGifStorageService.deleteKanjiGif(newUrl);
            throw ex;
        }

        // Xóa ảnh cũ trên R2 (sau khi lưu DB thành công)
        if (oldUrl != null && !oldUrl.isBlank()) {
            kanjiGifStorageService.deleteKanjiGif(oldUrl);
        }

        // Clear cache Redis (đảm bảo FE nhận ảnh mới)
        try {
            kanjiCacheService.deleteKanjiDetail(characterName);
            kanjiCacheService.clearAllPages();
            kanjiCacheService.clearAllKeywordCache();
            log.info("[REDIS CLEAR] Xóa cache sau khi update ảnh mới cho {}", characterName);
        } catch (Exception e) {
            log.warn("[REDIS ERROR] Thất bại xóa cache sau khi update Kanji GIF: {}", e.getMessage());
        }
        return kanjiMapper.toKanjiResponse(kanji);
    }

    @Override
    @Transactional(readOnly = true)
    public KanjiDecompositionResult analyzeKanji(String character) {
        KanjiDecompositionResult cached = kanjiCacheService.getKanjiByAi(character);
        if (cached != null) {
            log.info("[CACHE HIT] Tìm thấy Kanji decomposition {}", character);
            return cached;
        }
        log.info("[CACHE MISS] Gọi api gemini phân tích kanji: {}", character);
        KanjiDecompositionResult result = geminiService.analyzeKanjiStructure(character);
        kanjiCacheService.saveKanjiByAi(character, result);
        log.info("[CACHE SAVE] Lưu cache decomposition: {}", character);
        return result;
    }
}
