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
import org.springframework.web.client.RestTemplate;

import com.example.javi.dto.request.KanjiRequest;
import com.example.javi.dto.response.KanjiDetailResponse;
import com.example.javi.dto.response.KanjiResponse;
import com.example.javi.entity.Kanji;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.KanjiMapper;
import com.example.javi.repository.KanjiRepository;
import com.example.javi.repository.VocabulariesRepository;
import com.example.javi.service.KanjiService;
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
    ObjectMapper objectMapper;
    RestTemplate restTemplate = new RestTemplate();
    static String BASE_URL_KANJI_ALIVE = "https://app.kanjialive.com/api/kanji/";
    static String BASE_URL_KANJI_API = "https://kanjiapi.dev/v1/kanji/";

    @Override
    @Transactional
    public KanjiResponse createOrUpdateKanji(KanjiRequest kanjiRequest) {
        String character = kanjiRequest.getCharacterName();
        // Đã dùng @valid rồi nên hơi thừa :v
        if (character == null || character.trim().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_KANJI);
        }

        Optional<Kanji> existingKanji = kanjiRepository.findByCharacterName(kanjiRequest.getCharacterName());
        if (kanjiRequest.getSinoViName() != null
                && !kanjiRequest.getSinoViName().isBlank()) {
            String s = Normalizer.normalize(kanjiRequest.getSinoViName().trim(), Normalizer.Form.NFC)
                    .toUpperCase(Locale.forLanguageTag("vi"));
            kanjiRequest.setSinoViName(s);
        }
        if (existingKanji.isPresent()) {
            // Cập nhật nếu đã tồn tại
            Kanji kanji = existingKanji.get();
            kanjiMapper.updateKanjiFromDTO(kanjiRequest, kanji);
            kanji = kanjiRepository.save(kanji);
            return kanjiMapper.toKanjiResponse(kanji);

        } else {
            // Tạo mới nếu chưa tồn tại
            Kanji newKanji = kanjiMapper.toKanji(kanjiRequest);
            newKanji = kanjiRepository.save(newKanji);
            return kanjiMapper.toKanjiResponse(newKanji);
        }
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
        kanjiRepository.deleteKanjiByCharacterName(characterName);
    }

    @Override
    public KanjiDetailResponse getKanjiDetailByCharacterName(String kanjiChar) {
        if (kanjiChar == null || kanjiChar.trim().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_KANJI);
        }
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
        return kanjiDetailResponse;
    }

    @Override
    public List<KanjiResponse> getKanjiByKeyWord(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_KANJI);
        }

        String q = keyword.trim();
        List<KanjiResponse> results = new ArrayList<>();

        // Một chữ Kanji duy nhất
        if (ValidationUtils.isSingleKanji(q)) {
            kanjiRepository
                    .findByCharacterName(q)
                    .map(kanjiMapper::toKanjiResponse)
                    .ifPresent(results::add);
            return results;
        }

        // Chuỗi toàn Kanji (ví dụ 勉強)
        if (ValidationUtils.isAllKanji(q)) {
            for (String ch : ValidationUtils.extractKanjiChars(q)) {
                kanjiRepository
                        .findByCharacterName(ch)
                        .map(kanjiMapper::toKanjiResponse)
                        .ifPresent(results::add);
            }
            if (!results.isEmpty()) return results;
        }

        // Chuỗi chứa Kana (食べるの見る, 勉強する, v.v.)
        if (ValidationUtils.containsKana(q)) {
            vocabulariesRepository.findByWord(q).ifPresent(vocab -> vocab.getKanjis()
                    .forEach(k -> results.add(kanjiMapper.toKanjiResponse(k))));

            if (!results.isEmpty()) return results;

            for (String ch : ValidationUtils.extractKanjiChars(q)) {
                kanjiRepository
                        .findByCharacterName(ch)
                        .map(kanjiMapper::toKanjiResponse)
                        .ifPresent(results::add);
            }
            if (!results.isEmpty()) return results;
        }

        // Fallback: Hán Việt
        results.addAll(kanjiRepository.findBySinoViName(q).stream()
                .map(kanjiMapper::toKanjiResponse)
                .toList());
        return results;
    }

    @Override
    public Page<Kanji> getAllKanjiByFilter(Specification<Kanji> spec, Pageable pageable) {
        return kanjiRepository.findAll(spec, pageable);
    }
}
