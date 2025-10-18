package com.example.javi.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.Comment;
import com.example.javi.entity.CommentReaction;
import com.example.javi.entity.ReactionType;
import com.example.javi.entity.Users;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {
    Optional<CommentReaction> findByUserAndComment(Users user, Comment comment);

    Page<CommentReaction> findByUserAndReactionTypeOrderByIdDesc(
            Users user, ReactionType reactionType, Pageable pageable);

    long countByCommentAndReactionType(Comment comment, ReactionType reactionType);
}
