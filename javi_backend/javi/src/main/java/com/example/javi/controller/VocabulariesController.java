package com.example.javi.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.javi.dto.request.VocabRequest;
import com.example.javi.dto.request.VocabUpdateDTO;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.VocabUpdateResponse;
import com.example.javi.entity.EntityType;
import com.example.javi.entity.Users;
import com.example.javi.entity.Vocabularies;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.service.HistorySearchService;
import com.example.javi.service.VocabulariesService;
import com.example.javi.utils.SecurityUtil;
import com.example.javi.utils.ValidationUtils;
import com.turkraft.springfilter.boot.Filter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/vocab")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class VocabulariesController {
    VocabulariesService vocabulariesService;
    HistorySearchService historySearchService;
    SecurityUtil securityUtil;

    @PostMapping("")
    public ApiResponse createVocabulary(@Valid @RequestBody VocabRequest request) {
        boolean isJapanese = ValidationUtils.isJapanese(request.getWord());
        if (!isJapanese) {
            throw new AppException(ErrorCode.INVALID_WORD);
        }
        vocabulariesService.createVocabulary(request);
        return ApiResponse.builder().message("Đã tạo từ vựng").build();
    }

    @PutMapping("/{id}")
    public ApiResponse updateVocabulary(@PathVariable Long id, @Valid @RequestBody VocabUpdateDTO request) {
        boolean isJapanese = ValidationUtils.isJapanese(request.getWord());
        if (!isJapanese) {
            throw new AppException(ErrorCode.INVALID_WORD);
        }
        VocabUpdateResponse vocab = vocabulariesService.updateVocabulary(id, request);
        return ApiResponse.builder()
                .message("Cập nhật thành công")
                .result(vocab)
                .build();
    }

    @GetMapping("/search/{keyword}")
    public ResponseEntity<List<Vocabularies>> searchVocabularies(
            @PathVariable String keyword, Authentication authentication) {
        List<Vocabularies> results = vocabulariesService.searchVocabularies(keyword);
        if (authentication != null && authentication.isAuthenticated()) {
            Users user = securityUtil.getCurrentUser();
            historySearchService.saveHistoryByKeyword(user, keyword, EntityType.WORD);
        }
        return ResponseEntity.ok(results);
    }

    @GetMapping("/id/{id}")
    public ResponseEntity<Vocabularies> getVocabularyById(@PathVariable Long id, Authentication authentication) {
        Vocabularies vocab = vocabulariesService.getVocabularyById(id);
        if (authentication != null && authentication.isAuthenticated()) {
            Users user = securityUtil.getCurrentUser();
            historySearchService.saveHistoryByEntity(user, id, EntityType.WORD, vocab.getWord());
        }
        return ResponseEntity.ok(vocab);
    }

    @GetMapping("/search/word/{word}")
    public ResponseEntity<Vocabularies> getVocabularyByWord(@PathVariable String word, Authentication authentication) {
        Vocabularies vocab = vocabulariesService.getVocabularyByWord(word);
        if (authentication != null && authentication.isAuthenticated()) {
            Users user = securityUtil.getCurrentUser();
            historySearchService.saveHistoryByEntity(user, vocab.getVocabId(), EntityType.WORD, vocab.getWord());
        }
        return ResponseEntity.ok(vocab);
    }

    @GetMapping("")
    public ApiResponse getAllVocabularyByFilter(
            @Filter Specification<Vocabularies> spec, @PageableDefault(size = 20, sort = "vocabId") Pageable pageable) {
        int page = pageable.getPageNumber();
        // Nếu người dùng gửi page=1, page ở đây là 1. trừ đi 1 để nó thành 0 (trang đầu tiên).
        // Nếu người dùng gửi page=0, page ở đây là 0 (hoặc lỗi), giữ nguyên 0.
        if (page > 0) {
            page = page - 1;
        }
        Pageable oneIndexPageable = PageRequest.of(page, pageable.getPageSize(), pageable.getSort());
        return ApiResponse.builder()
                .message("Lấy từ vựng thành công")
                .result(vocabulariesService.getAllVocabulariesByFilter(spec, oneIndexPageable))
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse deleteVocabulary(@PathVariable Long id) {
        vocabulariesService.deleteVocabularyById(id);
        return ApiResponse.builder().message("Xóa từ vựng thành công").build();
    }
}
