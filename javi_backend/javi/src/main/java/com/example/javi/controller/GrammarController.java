package com.example.javi.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import com.example.javi.dto.request.CreateGrammarRequest;
import com.example.javi.dto.request.GrammarCheckSourceText;
import com.example.javi.dto.request.GrammarSearchRequest;
import com.example.javi.dto.request.UpdateGrammarRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.GrammarCheckResult;
import com.example.javi.dto.response.GrammarResponse;
import com.example.javi.entity.EntityType;
import com.example.javi.entity.Grammar;
import com.example.javi.entity.Users;
import com.example.javi.service.GeminiService;
import com.example.javi.service.GrammarService;
import com.example.javi.service.HistorySearchService;
import com.example.javi.utils.SecurityUtil;
import com.turkraft.springfilter.boot.Filter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/grammar")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class GrammarController {
    GrammarService grammarService;
    HistorySearchService historySearchService;
    SecurityUtil securityUtil;
    GeminiService geminiService;

    @PostMapping("")
    @PreAuthorize("hasAuthority('CREATE_GRAMMAR')")
    public ApiResponse<GrammarResponse> createGrammar(@RequestBody CreateGrammarRequest request) {
        GrammarResponse grammarResponse = grammarService.createGrammar(request);
        return ApiResponse.<GrammarResponse>builder()
                .result(grammarResponse)
                .message("Tạo ngữ pháp thành công")
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('UPDATE_GRAMMAR')")
    public ApiResponse<GrammarResponse> updateGrammar(
            @PathVariable Long id, @RequestBody @Valid UpdateGrammarRequest request) {
        GrammarResponse response = grammarService.updateGrammar(id, request);
        return ApiResponse.<GrammarResponse>builder()
                .message("Cập nhật ngữ pháp thành công.")
                .result(response)
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_GRAMMAR')")
    public ApiResponse<Void> deleteGrammar(@PathVariable Long id) {
        grammarService.deleteGrammar(id);
        return ApiResponse.<Void>builder().message("Xóa ngữ pháp thành công").build();
    }

    @GetMapping("/{id}")
    public ApiResponse<GrammarResponse> getDetailGrammarById(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean saveHistory,
            Authentication authentication) {
        GrammarResponse grammarResponse = grammarService.getGrammarById(id);
        if (saveHistory && authentication != null && authentication.isAuthenticated()) {
            Users user = securityUtil.getCurrentUser();
            historySearchService.saveHistoryByEntity(
                    user, grammarResponse.getId(), EntityType.GRAMMAR, grammarResponse.getPattern());
        }
        return ApiResponse.<GrammarResponse>builder()
                .result(grammarResponse)
                .message("Lấy ngữ pháp thành công")
                .build();
    }

    @GetMapping("/search")
    public ApiResponse<Page<GrammarResponse>> searchGrammars(
            @ModelAttribute GrammarSearchRequest request,
            @PageableDefault(size = 10, sort = "grammarId", direction = Sort.Direction.DESC) Pageable pageable,
            @RequestParam(defaultValue = "true") boolean saveHistory,
            Authentication authentication) {

        Page<GrammarResponse> responsePage = grammarService.searchGrammars(request, pageable);
        if (saveHistory && authentication != null && authentication.isAuthenticated()) {
            Users user = securityUtil.getCurrentUser();
            historySearchService.saveHistoryByKeyword(user, request.getKeyword(), EntityType.GRAMMAR);
        }
        return ApiResponse.<Page<GrammarResponse>>builder()
                .message("Tìm kiếm mẫu ngữ pháp thành công.")
                .result(responsePage)
                .build();
    }

    @GetMapping("")
    public ApiResponse<Page<GrammarResponse>> findGrammarByFilter(
            @Filter Specification<Grammar> spec,
            @RequestParam(required = false) String filter,
            @PageableDefault(size = 20, sort = "grammarId", direction = Sort.Direction.DESC) Pageable pageable) {
        return ApiResponse.<Page<GrammarResponse>>builder()
                .message("Lấy danh sách Ngữ pháp thành công")
                .result(grammarService.getAllGrammarByFilter(spec, pageable, filter))
                .build();
    }

    @PostMapping("/check")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<GrammarCheckResult> checkGrammar(@Valid @RequestBody GrammarCheckSourceText request) {
        GrammarCheckResult response = geminiService.checkGrammar(request);
        return ApiResponse.<GrammarCheckResult>builder()
                .message("Kiểm tra ngữ pháp thành công")
                .result(response)
                .build();
    }
}
