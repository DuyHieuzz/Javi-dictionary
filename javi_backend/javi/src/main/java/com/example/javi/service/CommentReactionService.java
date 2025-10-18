package com.example.javi.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import com.example.javi.dto.response.CommentResponse;
import com.example.javi.entity.Users;

public interface CommentReactionService {
    Page<CommentResponse> getMyLikedComments(Users user, Pageable pageable);
}
