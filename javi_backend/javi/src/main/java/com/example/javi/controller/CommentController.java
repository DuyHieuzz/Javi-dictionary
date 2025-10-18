package com.example.javi.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.example.javi.dto.request.CreateCommentRequest;
import com.example.javi.dto.request.UpdateCommentRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.CommentResponse;
import com.example.javi.entity.EntityType;
import com.example.javi.service.CommentService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;

@RestController
@RequestMapping("${api.prefix}/comments")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class CommentController {
    CommentService commentService;

    @PostMapping("")
    @PreAuthorize("hasAuthority('CREATE_COMMENT')")
    public ApiResponse<CommentResponse> create(@RequestBody @Valid CreateCommentRequest req) {
        return ApiResponse.<CommentResponse>builder()
                .result(commentService.createComment(req))
                .message("Bình luận thành công")
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('UPDATE_COMMENT', 'MANAGE_USER_COMMENT')")
    public ApiResponse<CommentResponse> update(
            @PathVariable Long id, @Valid @RequestBody UpdateCommentRequest request) {
        CommentResponse commentResponse = commentService.updateComment(id, request);
        return ApiResponse.<CommentResponse>builder()
                .message("Cập nhật bình luận thành công")
                .result(commentResponse)
                .build();
    }

    // Đã xử lý comment của user bị block sẽ không xuất hiện (trừ khi bị cache redis 6 tiếng)
    @GetMapping
    public ApiResponse<Page<CommentResponse>> getCommentsByEntity(
            @RequestParam EntityType entityType,
            @RequestParam Long entityId,
            @PageableDefault(
                            size = 10,
                            sort = {"likeCount", "createdAt"},
                            direction = Sort.Direction.DESC)
                    Pageable pageable) {
        int currentPage = pageable.getPageNumber();
        if (currentPage > 0) currentPage = currentPage - 1;

        Pageable adjustedPageable = PageRequest.of(currentPage, pageable.getPageSize(), pageable.getSort());

        Page<CommentResponse> result = commentService.getCommentsByEntity(entityType, entityId, adjustedPageable);
        return ApiResponse.<Page<CommentResponse>>builder().result(result).build();
    }

    @GetMapping("/user/{username}")
    public ApiResponse<Page<CommentResponse>> getCommentsByUsername( // lấy bình luận của người dùng cụ thể
            @PathVariable String username,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        int page = pageable.getPageNumber();
        if (page <= 0) page = 1;
        Pageable oneIndexedPageable = PageRequest.of(page - 1, pageable.getPageSize(), pageable.getSort());

        Page<CommentResponse> result = commentService.getCommentsByUsername(username, oneIndexedPageable);
        return ApiResponse.<Page<CommentResponse>>builder()
                .message("Lấy bình luận thành công")
                .result(result)
                .build();
    }

    @GetMapping("/my-comment")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Page<CommentResponse>> getMyComments( // lấy bình luận của mình, giờ nhận ra nó giống ở trên :v
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        int page = pageable.getPageNumber();
        if (page <= 0) page = 1;
        Pageable oneIndexPageable = PageRequest.of(page - 1, pageable.getPageSize(), pageable.getSort());
        Page<CommentResponse> result = commentService.getMyComments(oneIndexPageable);
        return ApiResponse.<Page<CommentResponse>>builder().result(result).build();
    }

    // Đã xử lý comment của user bị block sẽ không xuất hiện (trừ khi bị cache redis 6 tiếng)
    @GetMapping("/all")
    public ApiResponse<Page<CommentResponse>> getAllComments(
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        int page = pageable.getPageNumber();
        if (page <= 0) page = 1;
        Pageable oneIndexPageable = PageRequest.of(page - 1, pageable.getPageSize(), pageable.getSort());
        Page<CommentResponse> responses = commentService.getAllComment(oneIndexPageable);

        return ApiResponse.<Page<CommentResponse>>builder()
                .message("Lấy bình luận thành công")
                .result(responses)
                .build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('DELETE_COMMENT') or hasAuthority('MANAGE_USER_COMMENT')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        commentService.deleteComment(id);
        return ApiResponse.<Void>builder().message("Xóa bình luận thành công").build();
    }

    @PostMapping("/{commentId}/react")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<Void> react(@PathVariable Long commentId, @RequestParam String type) { // LIKE hoặc DISLIKE
        commentService.reactToComment(commentId, type);
        return ApiResponse.<Void>builder().message("Cập nhật phản ứng").build();
    }
}
