package com.example.javi.service.cache;

import java.time.Duration;

import org.springframework.data.domain.Page;
import org.springframework.stereotype.Service;

import com.example.javi.dto.response.CommentResponse;
import com.example.javi.dto.response.PageWrapper;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentCacheService {
    RedisHelper redisHelper;
    String PREFIX = "comment:page:";
    Duration TTL = Duration.ofHours(6);

    private String buildKey(String entityType, Long entityId, int page, int size) {
        return PREFIX + entityType + ":" + entityId + ":p" + page + ":s" + size;
    }

    public Page<CommentResponse> getCommentsPage(String entityType, Long entityId, int page, int size) {
        String key = buildKey(entityType, entityId, page, size);
        return redisHelper.findPage(key, CommentResponse.class);
    }

    public void saveCommentsPage(String entityType, Long entityId, int page, int size, Page<CommentResponse> data) {
        String key = buildKey(entityType, entityId, page, size);
        PageWrapper<CommentResponse> wrapper =
                new PageWrapper<>(data.getContent(), data.getNumber(), data.getSize(), data.getTotalElements());
        redisHelper.save(key, wrapper, TTL);
    }

    public void clearEntityPages(String entityType, Long entityId) {
        String pattern = PREFIX + entityType + ":" + entityId + ":*";
        redisHelper.deleteByPattern(pattern);
        log.info("[CACHE CLEAR] Xóa comment pages cho {}:{}", entityType, entityId);
    }

}
