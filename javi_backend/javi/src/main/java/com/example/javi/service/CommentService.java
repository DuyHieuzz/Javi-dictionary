package com.example.javi.service;

import com.example.javi.dto.request.CreateCommentRequest;
import com.example.javi.dto.response.CommentResponse;
import com.example.javi.entity.EntityType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface CommentService {
    CommentResponse createComment(CreateCommentRequest request);
    Page<CommentResponse> getCommentsByEntity(EntityType entityType, Long entityId, Pageable pageable);
    Page<CommentResponse> getCommentsByUsername(String username, Pageable pageable);
    Page<CommentResponse> getMyComments(Pageable pageable);
    void deleteComment(Long id);
    void reactToComment(Long commentId, String type); // LIKE / DISLIKE
}
