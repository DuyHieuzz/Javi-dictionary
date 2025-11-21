package com.example.javi.controller;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

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
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<?> searchHistory(
            @PageableDefault(size = 15, sort = "searchedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Users user = securityUtil.getCurrentUser();
        Page<HistorySearch> response = historySearchService.getHistorySearch(user, pageable);
        return ApiResponse.builder()
                .message("Lấy lịch sử người dùng thành công")
                .result(response)
                .build();
    }

    @DeleteMapping("/delete-all")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> deleteAllHistory() {
        Users user = securityUtil.getCurrentUser();
        historySearchService.deleteAllByUser(user);
        return ApiResponse.<Void>builder()
                .message("Đã xóa toàn bộ lịch sử tìm kiếm của bạn.")
                .build();
    }

    @DeleteMapping("")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> deleteSelectedHistory(@RequestBody List<Long> ids) {
        Users user = securityUtil.getCurrentUser();
        historySearchService.deleteByIdsForUser(ids, user);
        return ApiResponse.<Void>builder()
                .message("Đã xóa lịch sử tìm kiếm đã chọn.")
                .build();
    }
}
