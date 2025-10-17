package com.example.javi.service.cache;

import java.time.Duration;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.example.javi.dto.response.GrammarResponse;
import com.example.javi.dto.response.PageWrapper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GrammarCacheService {
    RedisHelper redisHelper;
    String PREFIX = "grammar:";
    Duration TTL = Duration.ofHours(6);

    public GrammarResponse getGrammar(Long id) {
        return redisHelper.find(PREFIX + id, GrammarResponse.class);
    }

    public void saveGrammar(Long id, GrammarResponse data) {
        redisHelper.save(PREFIX + id, data, TTL);
    }

    public void deleteGrammar(Long id) {
        redisHelper.delete(PREFIX + id);
    }

    public Page<GrammarResponse> getPage(String keyword) {
        return redisHelper.findPage(keyword, GrammarResponse.class);
    }

    public void savePage(String key, Page<GrammarResponse> pageData) {
        PageWrapper<GrammarResponse> wrapper = new PageWrapper<>(
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
}
