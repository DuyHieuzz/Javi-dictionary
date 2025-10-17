package com.example.javi.service.cache;

import java.time.Duration;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.example.javi.dto.response.KanjiDetailResponse;
import com.example.javi.dto.response.KanjiResponse;
import com.example.javi.dto.response.PageWrapper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class KanjiCacheService {
    RedisHelper redisHelper;
    String PREFIX = "kanji:";
    Duration TTL = Duration.ofHours(6);

    // Cache kanjiDetailResponse
    public KanjiDetailResponse getKanjiDetail(String characterName) {
        return redisHelper.find(PREFIX + "detail:" + characterName, KanjiDetailResponse.class);
    }

    public void saveKanjiDetail(String characterName, KanjiDetailResponse data) {
        redisHelper.save(PREFIX + "detail:" + characterName, data, TTL);
    }

    public void deleteKanjiDetail(String characterName) {
        redisHelper.delete(PREFIX + "detail:" + characterName);
    }

    // Cache page
    public Page<KanjiResponse> getPage(String key) {
        return redisHelper.findPage(key, KanjiResponse.class);
    }

    public void savePage(String key, Page<KanjiResponse> pageData) {
        PageWrapper<KanjiResponse> wrapper = new PageWrapper<>(
                pageData.getContent(), pageData.getNumber(), pageData.getSize(), pageData.getTotalElements());
        redisHelper.save(key, wrapper, TTL);
    }

    public void deletePage(int page, int size) {
        String key = String.format(PREFIX + "page:%d:%d", page, size);
        redisHelper.delete(key);
    }

    public void clearAllPages() {
        redisHelper.deleteByPattern(PREFIX + "page:*");
    }

    // Cache kết quả tìm kiếm theo keyword
    public List<KanjiResponse> getKanjiByKeyword(String keyword) {
        return redisHelper.findList(PREFIX + "keyword:" + keyword.toUpperCase(), KanjiResponse.class);
    }

    public void saveKanjiByKeyword(String keyword, List<KanjiResponse> data) {
        redisHelper.save(PREFIX + "keyword:" + keyword.toUpperCase(), data, TTL);
    }

    public void deleteKanjiByKeyword(String keyword) {
        redisHelper.delete(PREFIX + "keyword:" + keyword.toUpperCase());
    }

    public void clearAllKeywordCache() {
        redisHelper.deleteByPattern(PREFIX + "keyword:*");
    }
}
