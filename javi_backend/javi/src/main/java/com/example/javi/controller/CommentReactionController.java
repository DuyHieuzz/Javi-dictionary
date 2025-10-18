package com.example.javi.controller;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.CommentResponse;
import com.example.javi.entity.Users;
import com.example.javi.service.CommentReactionService;
import com.example.javi.utils.SecurityUtil;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("${api.prefix}/comment-reactions")
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CommentReactionController {

    CommentReactionService commentReactionService;
    SecurityUtil securityUtil;

    @GetMapping("/liked")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<CommentResponse>> getMyLikedComments(
            @PageableDefault(size = 20, sort = "id", direction = Sort.Direction.DESC) Pageable pageable) {
        int page = pageable.getPageNumber();
        if (page <= 0) page = 1;
        Pageable oneIndexedPageable = PageRequest.of(page - 1, pageable.getPageSize(), pageable.getSort());

        Users user = securityUtil.getCurrentUser();

        Page<CommentResponse> response = commentReactionService.getMyLikedComments(user, oneIndexedPageable);

        return ApiResponse.<Page<CommentResponse>>builder()
                .message("Lấy danh sách bình luận đã like thành công")
                .result(response)
                .build();
    }
}
