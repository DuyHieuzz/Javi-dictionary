package com.example.javi.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.javi.dto.response.ApiResponse;
import com.example.javi.entity.HistorySearch;
import com.example.javi.entity.Users;
import com.example.javi.service.HistorySearchService;
import com.example.javi.utils.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/history")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class HistorySearchController {
    HistorySearchService historySearchService;
    SecurityUtil securityUtil;

    @GetMapping("")
    public ApiResponse<?> searchHistory(
            @PageableDefault(size = 15, sort = "searchedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Users user = securityUtil.getCurrentUser();
        int page = pageable.getPageNumber();
        if (page <= 0) page = 1;
        Pageable oneIndexPageable = PageRequest.of(page - 1, pageable.getPageSize(), pageable.getSort());

        Page<HistorySearch> response = historySearchService.getHistorySearch(user, oneIndexPageable);
        return ApiResponse.builder()
                .message("Lấy lịch sử người dùng thành công")
                .result(response)
                .build();
    }
}
