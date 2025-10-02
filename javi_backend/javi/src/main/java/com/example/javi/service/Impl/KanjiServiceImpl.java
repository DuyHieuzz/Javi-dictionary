package com.example.javi.service.Impl;

import com.example.javi.dto.request.KanjiRequest;
import com.example.javi.dto.response.KanjiDetailResponse;
import com.example.javi.dto.response.KanjiResponse;
import com.example.javi.entity.Kanji;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.KanjiMapper;
import com.example.javi.repository.KanjiRepository;
import com.example.javi.service.KanjiService;
import com.example.javi.utils.ValidationUtils;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class KanjiServiceImpl implements KanjiService {
    KanjiRepository kanjiRepository;
    KanjiMapper kanjiMapper;
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
        if (characterName == null || characterName.trim().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_KANJI);
        }
        Kanji existingKanji = kanjiRepository.findByCharacterName(characterName)
                .orElseThrow(() -> new AppException(ErrorCode.KANJI_NOT_FOUND));
        // Nếu kanji còn liên kết từ vựng khác -> ném ra lỗi báo kanji còn được sử dụng
        if (existingKanji.getVocabularies() != null && !existingKanji.getVocabularies().isEmpty()) {
            throw new AppException(ErrorCode.KANJI_STILL_IN_USE);
        }
        kanjiRepository.deleteKanjiByCharacterName(characterName);
    }

    @Override
    public KanjiDetailResponse getKanjiDetailByCharacterName(String kanjiChar) {
        if (kanjiChar == null || kanjiChar.trim().isEmpty()) {
            throw new AppException(ErrorCode.EMPTY_KANJI);
        }
        Kanji existingKanji = kanjiRepository.findByCharacterName(kanjiChar)
                .orElseThrow(() -> new AppException(ErrorCode.KANJI_NOT_FOUND));
        KanjiDetailResponse kanjiDetailResponse = kanjiMapper.toKanjiDetailResponse(existingKanji);
        ObjectMapper mapper = new ObjectMapper();
        // Do kanji alive không đầy đủ kanji nên rủi ro -> kết hợp call 2 api (kanji alive có mp4, kanji api không có mp4 nhưng đủ kanji)
        try {
            //KANJI ALIVE để lấy video mp4 vẽ kanji, không có thì không có vẽ
            String kanjiAliveUrl = BASE_URL_KANJI_ALIVE + kanjiChar;
            String kanjiAliveJson = restTemplate.getForObject(kanjiAliveUrl, String.class);

            JsonNode kanjiAlive = mapper.readTree(kanjiAliveJson);
            kanjiDetailResponse.setVideoUrl(kanjiAlive.path("mp4_video_source").asText(""));

            //KANJI API để lấy các trường onyomi, kunyomi, stroke
            String kanjiApiUrl = BASE_URL_KANJI_API + kanjiChar;
            String kanjiApiJson = restTemplate.getForObject(kanjiApiUrl, String.class);
            JsonNode kanjiApi = mapper.readTree(kanjiApiJson);
            List<String> onReadings = mapper.convertValue(kanjiApi.get("on_readings"), new TypeReference<List<String>>() {
            });
            List<String> kunReadings = mapper.convertValue(kanjiApi.get("kun_readings"), new TypeReference<List<String>>() {
            });
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
        List<KanjiResponse> kanjiResponses = new ArrayList<>();

        if (ValidationUtils.isKanji(keyword)) {
            Kanji existingKanji = kanjiRepository.findByCharacterName(keyword)
                    .orElseThrow(() -> new AppException(ErrorCode.KANJI_NOT_FOUND));
            kanjiResponses.add(kanjiMapper.toKanjiResponse(existingKanji));
            return kanjiResponses;
        }
        List<Kanji> existingKanji = kanjiRepository.findBySinoViNameContainingIgnoreCase(keyword);
        for (Kanji kanji : existingKanji) {
            kanjiResponses.add(kanjiMapper.toKanjiResponse(kanji));
        }
        return kanjiResponses;
    }

    @Override
    public Page<Kanji> getAllKanjiByFilter(Specification<Kanji> spec, Pageable pageable) {
        return kanjiRepository.findAll(spec, pageable);
    }
}
