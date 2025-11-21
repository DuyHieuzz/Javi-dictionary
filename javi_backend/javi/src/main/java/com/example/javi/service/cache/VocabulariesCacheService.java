package com.example.javi.service.cache;

import java.time.Duration;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.example.javi.dto.response.PageWrapper;
import com.example.javi.dto.response.VocabResponse;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VocabulariesCacheService {

    RedisHelper redisHelper;

    String PREFIX = "vocab:";
    Duration TTL = Duration.ofHours(6);
    String EXPLAIN_PREFIX = "vocab:explain:";
    Duration EXPLAIN_TTL = Duration.ofHours(24);

    // CACHE SEARCH KEYWORD
    public List<VocabResponse> getSearch(String keyword) {
        return redisHelper.findList(PREFIX + "keyword:" + keyword, VocabResponse.class);
    }

    public void saveSearch(String keyword, List<VocabResponse> data) {
        redisHelper.save(PREFIX + "keyword:" + keyword, data, TTL);
    }

    public void clearAllSearches() {
        redisHelper.deleteByPattern(PREFIX + "keyword:*");
    }

    // CACHE TỪ VỰNG ĐƠN

    public VocabResponse get(String word) {
        return redisHelper.find(PREFIX + "word:" + word, VocabResponse.class);
    }

    public void save(String word, VocabResponse data) {
        redisHelper.save(PREFIX + "word:" + word, data, TTL);
    }

    public void delete(String word) {
        redisHelper.delete(PREFIX + "word:" + word);
    }

    // CACHE PAGE (PHÂN TRANG)

    public Page<VocabResponse> getPage(String key) {
        return redisHelper.findPage(key, VocabResponse.class);
    }

    public void savePage(String key, Page<VocabResponse> pageData) {
        PageWrapper<VocabResponse> wrapper = new PageWrapper<>(
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

    // TIỆN ÍCH

    public void clearAllCache() {
        redisHelper.deleteByPattern(PREFIX + "*");
    }

    // CACHE GIẢI NGHĨA TỪ

    public String getExplain(String word) {
        return redisHelper.find(EXPLAIN_PREFIX + word, String.class);
    }

    public void saveExplain(String word, String content) {
        redisHelper.save(EXPLAIN_PREFIX + word, content, EXPLAIN_TTL);
    }

    public void deleteExplain(String word) {
        redisHelper.delete(EXPLAIN_PREFIX + word);
    }

    public void clearAllExplains() {
        redisHelper.deleteByPattern(EXPLAIN_PREFIX + "*");
    }

    // CACHE THEO ID
    public VocabResponse getById(Long id) {
        return redisHelper.find(PREFIX + "id:" + id, VocabResponse.class);
    }

    public void saveById(Long id, VocabResponse data) {
        redisHelper.save(PREFIX + "id:" + id, data, TTL);
    }

    public void deleteById(Long id) {
        redisHelper.delete(PREFIX + "id:" + id);
    }

}
