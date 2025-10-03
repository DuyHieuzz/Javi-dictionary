package com.example.javi.controller;

import com.example.javi.dto.request.CreateGrammarRequest;
import com.example.javi.dto.request.GrammarSearchRequest;
import com.example.javi.dto.request.UpdateGrammarRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.GrammarResponse;
import com.example.javi.service.GrammarService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("${api.prefix}/grammar")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class GrammarController {
    GrammarService grammarService;

    @PostMapping("")
    public ApiResponse createGrammar(@RequestBody CreateGrammarRequest request) {
        GrammarResponse grammarResponse = grammarService.createGrammar(request);
        return ApiResponse.builder()
                .result(grammarResponse)
                .message("Tạo ngữ pháp thành công")
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<GrammarResponse> updateGrammar(
            @PathVariable Long id,
            @RequestBody @Valid UpdateGrammarRequest request) {
        GrammarResponse response = grammarService.updateGrammar(id, request);
        return ApiResponse.<GrammarResponse>builder()
                .message("Cập nhật ngữ pháp thành công.")
                .result(response)
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse deleteGrammar(@PathVariable Long id) {
        grammarService.deleteGrammar(id);
        return ApiResponse.builder()
                .message("Xóa ngữ pháp thành công")
                .build();
    }

    @GetMapping("/{id}")
    public ApiResponse getDetailGrammarById(@PathVariable Long id) {
        GrammarResponse grammarResponse = grammarService.getGrammarById(id);
        return ApiResponse.builder()
                .result(grammarResponse)
                .message("Lấy ngữ pháp thành công")
                .build();
    }

    @GetMapping("/search") // Endpoint GET /grammar/search
    public ApiResponse<Page<GrammarResponse>> searchGrammars(
            @ModelAttribute GrammarSearchRequest request,
            @PageableDefault(size = 5, sort = "grammarId") Pageable pageable) {
        Page<GrammarResponse> responsePage = grammarService.searchGrammars(request, pageable);
        return ApiResponse.<Page<GrammarResponse>>builder()
                .message("Tìm kiếm mẫu ngữ pháp thành công.")
                .result(responsePage)
                .build();
    }
}
