package com.example.javi.service.Impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.example.javi.dto.response.CommentResponse;
import com.example.javi.entity.CommentReaction;
import com.example.javi.entity.ReactionType;
import com.example.javi.entity.Users;
import com.example.javi.mapper.CommentMapper;
import com.example.javi.repository.CommentReactionRepository;
import com.example.javi.service.CommentReactionService;

import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
public class CommentReactionServiceImpl implements CommentReactionService {

    CommentReactionRepository commentReactionRepository;
    CommentMapper commentMapper;

    @Override
    public Page<CommentResponse> getMyLikedComments(Users user, Pageable pageable) {
        Page<CommentReaction> likedPage =
                commentReactionRepository.findByUserAndReactionTypeOrderByIdDesc(user, ReactionType.LIKE, pageable);

        return likedPage.map(reaction -> commentMapper.toCommentResponse(reaction.getComment()));
    }
}
