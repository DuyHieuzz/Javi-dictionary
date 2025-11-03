package com.example.javi.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.request.KanjiRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.KanjiDecompositionResult;
import com.example.javi.dto.response.KanjiDetailResponse;
import com.example.javi.dto.response.KanjiResponse;
import com.example.javi.entity.AccountType;
import com.example.javi.entity.EntityType;
import com.example.javi.entity.Kanji;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.service.HistorySearchService;
import com.example.javi.service.KanjiService;
import com.example.javi.utils.SecurityUtil;
import com.example.javi.utils.ValidationUtils;
import com.turkraft.springfilter.boot.Filter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/kanji")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class KanjiController {
    KanjiService kanjiService;
    HistorySearchService historySearchService;
    SecurityUtil securityUtil;

    @PostMapping("")
    @PreAuthorize("hasAnyAuthority('CREATE_KANJI', 'UPDATE_KANJI')")
    public ApiResponse<KanjiResponse> createOrUpdateKanji(@Valid @RequestBody KanjiRequest request) {
        if (!ValidationUtils.isKanji(request.getCharacterName())) {
            throw new AppException(ErrorCode.NOT_KANJI);
        }
        return ApiResponse.<KanjiResponse>builder()
                .message("Thành công")
                .result(kanjiService.createOrUpdateKanji(request))
                .build();
    }

    @DeleteMapping("")
    @PreAuthorize("hasAuthority('DELETE_KANJI')")
    public ApiResponse<Void> deleteKanjiByCharacterName(@RequestParam String characterName) {
        if (!ValidationUtils.isSingleKanji(characterName.trim())) {
            throw new AppException(ErrorCode.NOT_SINGLE_KANJI);
        }
        kanjiService.deleteKanjiByCharacterName(characterName);
        return ApiResponse.<Void>builder()
                .message("Xóa kanji" + characterName + " thành công")
                .build();
    }

    @PutMapping("/{character}/gif")
    @PreAuthorize("hasAnyAuthority('CREATE_KANJI','UPDATE_KANJI')")
    public ApiResponse<KanjiResponse> uploadKanjiGif(
            @PathVariable String character, @RequestParam("file") MultipartFile file) {
        if (!ValidationUtils.isKanji(character)) {
            throw new AppException(ErrorCode.NOT_KANJI);
        }
        if (!ValidationUtils.isSingleKanji(character)) {
            throw new AppException(ErrorCode.NOT_SINGLE_KANJI);
        }

        KanjiResponse kanjiResponse = kanjiService.updateKanjiGif(file, character);
        return ApiResponse.<KanjiResponse>builder()
                .message("Cập nhật GIF cho kanji '" + character + "' thành công")
                .result(kanjiResponse)
                .build();
    }

    @GetMapping("/analyze/{character}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<KanjiDecompositionResult> analyzeKanji(@PathVariable String character) {
        if (!ValidationUtils.isKanji(character)) {
            throw new AppException(ErrorCode.NOT_KANJI);
        }
        if (!ValidationUtils.isSingleKanji(character)) {
            throw new AppException(ErrorCode.NOT_SINGLE_KANJI);
        }
        Users user = securityUtil.getCurrentUser();
        if (user == null) {
            throw new AppException(ErrorCode.UNAUTHENTICATED);
        }
        if (user.getAccountType() != AccountType.PREMIUM) {
            throw new AppException(ErrorCode.REQUIRE_PREMIUM);
        }

        KanjiDecompositionResult result = kanjiService.analyzeKanji(character);
        return ApiResponse.<KanjiDecompositionResult>builder()
                .message("Phân tích cấu trúc Kanji thành công")
                .result(result)
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<List<KanjiResponse>> searchKanji(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "true") boolean saveHistory,
            Authentication authentication) {
        List<KanjiResponse> response = kanjiService.getKanjiByKeyWord(keyword.toUpperCase());
        if (saveHistory && authentication != null && authentication.isAuthenticated()) {
            Users user = securityUtil.getCurrentUser();
            historySearchService.saveHistoryByKeyword(user, keyword, EntityType.KANJI);
        }
        return ApiResponse.<List<KanjiResponse>>builder()
                .result(response)
                .message("Lấy Kanji thành công")
                .build();
    }

    @GetMapping("/search/get-mean")
    public ApiResponse<KanjiDetailResponse> searchDetailKanji(
            @RequestParam String characterName,
            @RequestParam(defaultValue = "true") boolean saveHistory,
            Authentication authentication) {
        if (!ValidationUtils.isKanji(characterName.trim())) {
            throw new AppException(ErrorCode.NOT_KANJI);
        }
        KanjiDetailResponse kanjiDetailResponse = kanjiService.getKanjiDetailByCharacterName(characterName);
        if (saveHistory && authentication != null && authentication.isAuthenticated()) {
            Users user = securityUtil.getCurrentUser();
            historySearchService.saveHistoryByEntity(
                    user, kanjiDetailResponse.getId(), EntityType.KANJI, kanjiDetailResponse.getCharacterName());
        }
        return ApiResponse.<KanjiDetailResponse>builder()
                .result(kanjiDetailResponse)
                .message("Lấy chi tiết kanji thành công")
                .build();
    }

    @GetMapping("")
    public ApiResponse<Page<KanjiResponse>> findKanjiByFilter(
            @Filter Specification<Kanji> spec,
            @RequestParam(required = false) String filter,
            @PageableDefault(size = 20, sort = "Id") Pageable pageable) {
        int page = pageable.getPageNumber();
        if (page <= 0) page = 1;
        Pageable oneIndexedPageable = PageRequest.of(page - 1, pageable.getPageSize(), pageable.getSort());

        return ApiResponse.<Page<KanjiResponse>>builder()
                .message("Lấy danh sách kanji thành công")
                .result(kanjiService.getAllKanjiByFilter(spec, oneIndexedPageable, filter))
                .build();
    }
}
