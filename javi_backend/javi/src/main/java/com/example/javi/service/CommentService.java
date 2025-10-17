package com.example.javi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.javi.dto.request.CreateCommentRequest;
import com.example.javi.dto.request.UpdateCommentRequest;
import com.example.javi.dto.response.CommentResponse;
import com.example.javi.entity.EntityType;

public interface CommentService {
    CommentResponse createComment(CreateCommentRequest request);

    CommentResponse updateComment(Long id, UpdateCommentRequest request);

    Page<CommentResponse> getCommentsByEntity(EntityType entityType, Long entityId, Pageable pageable);

    Page<CommentResponse> getCommentsByUsername(String username, Pageable pageable);

    Page<CommentResponse> getMyComments(Pageable pageable);

    void deleteComment(Long id);

    void reactToComment(Long commentId, String type); // LIKE / DISLIKE
}
