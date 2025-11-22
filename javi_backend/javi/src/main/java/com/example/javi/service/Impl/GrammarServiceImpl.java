package com.example.javi.service.Impl;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.DigestUtils;

import com.example.javi.dto.request.CreateGrammarRequest;
import com.example.javi.dto.request.GrammarExampleRequest;
import com.example.javi.dto.request.GrammarSearchRequest;
import com.example.javi.dto.request.UpdateGrammarRequest;
import com.example.javi.dto.response.GrammarResponse;
import com.example.javi.entity.Grammar;
import com.example.javi.entity.GrammarExample;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.GrammarExampleMapper;
import com.example.javi.mapper.GrammarMapper;
import com.example.javi.repository.GrammarExampleRepository;
import com.example.javi.repository.GrammarRepository;
import com.example.javi.service.GrammarService;
import com.example.javi.service.cache.GrammarCacheService;
import com.example.javi.specification.GrammarSpecification;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GrammarServiceImpl implements GrammarService {
    GrammarRepository grammarRepository;
    GrammarMapper grammarMapper;
    GrammarExampleMapper grammarExampleMapper;
    GrammarExampleRepository grammarExampleRepository;
    GrammarCacheService grammarCacheService;

    @Override
    @Transactional
    public GrammarResponse createGrammar(CreateGrammarRequest request) {

        if (grammarRepository.existsByPattern(request.getPattern())) {
            throw new AppException(ErrorCode.EXISTING_GRAMMAR_PATTERN);
        }

        Grammar grammar = grammarMapper.toGrammar(request);

        final Grammar finalGrammar = grammar;

        List<GrammarExample> examples =
                Optional.ofNullable(request.getExamples()).orElse(Collections.emptyList()).stream()
                        .map(grammarExampleMapper::toGrammarExample)
                        // Gán Foreign Key: example.setGrammar(grammar)
                        .peek(example -> example.setGrammar(finalGrammar))
                        .collect(Collectors.toCollection(ArrayList::new));

        grammar.setExamples(examples);

        grammar = grammarRepository.save(grammar);
        GrammarResponse grammarResponse = grammarMapper.toGrammarResponse(grammar);
        grammarCacheService.saveGrammar(grammar.getGrammarId(), grammarResponse);
        log.info("[GRAMMAR SAVE] Lưu grammar có id {}", grammar.getGrammarId());
        grammarCacheService.clearAllPages();
        log.info("[GRAMMAR CLEAR] Xóa tất cả cache page do có thêm grammar mới");
        return grammarResponse;
    }

    @Override
    @Transactional
    public GrammarResponse updateGrammar(Long id, UpdateGrammarRequest request) {
        Grammar existingGrammar =
                grammarRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.GRAMMAR_NOT_FOUND));

        // Kiểm tra pattern đã tồn tại ở grammar khác chưa
        if (grammarRepository.existsByPatternAndGrammarIdNot(request.getPattern(), id)) {
            throw new AppException(ErrorCode.EXISTING_GRAMMAR_PATTERN);
        }
        grammarMapper.updateGrammarFromRequest(request, existingGrammar);

        List<GrammarExampleRequest> exampleRequests =
                Optional.ofNullable(request.getExamples()).orElse(Collections.emptyList());

        // Lấy danh sách ID từ request (chỉ lấy cái có ID)
        List<Long> updatedExampleIds = exampleRequests.stream()
                .map(GrammarExampleRequest::getId)
                .filter(Objects::nonNull)
                .toList();

        // Xóa hết example cũ không có trong danh sách updated IDs
        if (!updatedExampleIds.isEmpty()) {
            grammarExampleRepository.bulkDeleteExamplesNotIn(existingGrammar.getGrammarId(), updatedExampleIds);
        } else {
            // Nếu request không gửi example nào => xóa sạch tất cả example cũ
            grammarExampleRepository.deleteByGrammarId(existingGrammar.getGrammarId());
        }
        List<GrammarExample> examplesToSaveOrUpdate = exampleRequests.stream()
                .map(req -> {
                    if (req.getId() != null) {
                        // Cập nhật ví dụ cũ
                        GrammarExample example = grammarExampleRepository
                                .findById(req.getId())
                                .orElseThrow(() -> new AppException(ErrorCode.GRAMMAR_EXAMPLE_NOT_FOUND));
                        grammarExampleMapper.updateGrammarExampleFromRequest(req, example);
                        return example;
                    } else {
                        // Tạo mới ví dụ
                        GrammarExample newExample = grammarExampleMapper.toGrammarExample(req);
                        newExample.setGrammar(existingGrammar);
                        return newExample;
                    }
                })
                .collect(Collectors.toCollection(ArrayList::new));
        existingGrammar.setExamples(examplesToSaveOrUpdate);
        Grammar updatedGrammar = grammarRepository.save(existingGrammar);
        GrammarResponse grammarResponse = grammarMapper.toGrammarResponse(updatedGrammar);

        grammarCacheService.deleteGrammar(updatedGrammar.getGrammarId());
        log.info("[CACHE DELETE] Xóa cache grammar có id: {}", id);
        grammarCacheService.clearAllPages();
        log.info("[CACHE CLEAR] Xóa tất cả cache page");
        grammarCacheService.saveGrammar(updatedGrammar.getGrammarId(), grammarResponse);
        log.info("[CACHE SAVE] Lưu cache grammar mới cập nhật có id: {}", id);
        return grammarResponse;
    }

    @Override
    @Transactional
    public void deleteGrammar(Long id) {
        if (!grammarRepository.existsById(id)) {
            throw new AppException(ErrorCode.GRAMMAR_NOT_FOUND);
        }
        grammarRepository.deleteById(id);
        grammarCacheService.clearAllPages();
        grammarCacheService.deleteGrammar(id);
        log.info("[CACHE CLEAR] Xóa tất cả cache page");
    }

    @Override
    public GrammarResponse getGrammarById(Long id) {
        GrammarResponse cached = grammarCacheService.getGrammar(id);
        if (cached != null) {
            log.info("[CACHE HIT] Lấy cache grammar với id: {}", id);
            return cached;
        }
        log.info("[CACHE MISS] Vào DB tìm grammar có id: {}", id);
        Optional<Grammar> grammar = grammarRepository.findById(id);
        if (grammar.isEmpty()) {
            throw new AppException(ErrorCode.GRAMMAR_NOT_FOUND);
        }
        GrammarResponse grammarResponse = grammarMapper.toGrammarResponse(grammar.get());
        grammarCacheService.saveGrammar(grammar.get().getGrammarId(), grammarResponse);
        log.info("[CACHE SAVE] Lưu cache grammar có id: {}", id);
        return grammarResponse;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<GrammarResponse> searchGrammars(GrammarSearchRequest request, Pageable pageable) {
        // Chuẩn hóa input
        String keyword = normalizeKeyword(request.getKeyword());
        String level = Optional.ofNullable(request.getLevel()).map(Enum::name).orElse("_");
        String sort = canonicalSort(pageable.getSort());

        // Tạo cache key an toàn, ngắn gọn, rõ ràng
        String key = String.format(
                "grammar:page:q=%s:level=%s:p=%d:s=%d:sort=%s",
                keyword, level, pageable.getPageNumber(), pageable.getPageSize(), sort);

        // Thử lấy từ cache trước
        Page<GrammarResponse> cachedPage = grammarCacheService.getPage(key);
        if (cachedPage != null) {
            log.info("[CACHE HIT] Lấy cache page grammar với key: {}", key);
            return cachedPage;
        }

        // Không có cache → truy DB
        Specification<Grammar> spec = GrammarSpecification.buildSpecification(request.getKeyword(), request.getLevel());

        Page<Grammar> grammarPage = grammarRepository.findAll(spec, pageable);
        Page<GrammarResponse> responsePage = grammarPage.map(grammarMapper::toGrammarResponse);

        // Lưu cache
        grammarCacheService.savePage(key, responsePage);
        log.info("[CACHE SAVE] Lưu cache page grammar với key {}", key);

        return responsePage;
    }

    @Override
    public Page<GrammarResponse> getAllGrammarByFilter(Specification<Grammar> spec, Pageable pageable, String filter) {
        // Chuẩn hóa filter string để build key (giữ nguyên chuỗi filter nếu có, hoặc "no-filter")
        String filterKey = (filter != null && !filter.isBlank()) ? filter.trim() : "no-filter";

        // Hash chuỗi filter để key ngắn gọn và tránh vấn đề ký tự đặc biệt
        String filterHash = DigestUtils.md5DigestAsHex(filterKey.getBytes());

        // key chứa prefix + hash + paging (giống Kanji)
        String cacheKey =
                String.format("grammar:page:%s:%d:%d", filterHash, pageable.getPageNumber(), pageable.getPageSize());

        // Thử lấy cache
        Page<GrammarResponse> cached = grammarCacheService.getPage(cacheKey);
        if (cached != null) {
            log.info("[CACHE HIT] key={} (filter='{}')", cacheKey, filterKey);
            return cached;
        }

        // Không có cache -> query DB
        Page<Grammar> page = grammarRepository.findAll(spec, pageable);
        Page<GrammarResponse> responsePage = page.map(grammarMapper::toGrammarResponse);

        // Lưu cache
        grammarCacheService.savePage(cacheKey, responsePage);
        log.info("[CACHE SAVE] key={} (filter='{}')", cacheKey, filterKey);

        return responsePage;
    }

    /**
     * Chuẩn hóa keyword để tránh ký tự đặc biệt phá key Redis.
     * Ví dụ: "N3 bài 1" -> "n3+bài+1"
     */
    private String normalizeKeyword(String keyword) {
        if (keyword == null || keyword.isBlank()) return "_";
        // Trim + lowercase + URL encode (để tránh dấu ':' hay khoảng trắng)
        return URLEncoder.encode(keyword.trim().toLowerCase(), StandardCharsets.UTF_8);
    }

    /**
     * Chuẩn hóa sort để key không bị fragment khi nhiều field hoặc format khác nhau.
     * Ví dụ: Sort.by("grammarId", "asc") -> "grammarId:ASC"
     */
    private String canonicalSort(Sort sort) {
        if (sort == null || sort.isEmpty()) return "_";
        return sort.stream()
                .map(order -> order.getProperty() + ":" + order.getDirection().name())
                .collect(Collectors.joining(","));
    }
}
