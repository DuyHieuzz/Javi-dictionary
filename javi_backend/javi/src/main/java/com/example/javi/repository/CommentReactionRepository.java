package com.example.javi.repository;

import com.example.javi.entity.Comment;
import com.example.javi.entity.CommentReaction;
import com.example.javi.entity.ReactionType;
import com.example.javi.entity.Users;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface CommentReactionRepository extends JpaRepository<CommentReaction, Long> {
    Optional<CommentReaction> findByUserAndComment(Users user, Comment comment);
    long countByCommentAndReactionType(Comment comment, ReactionType reactionType);
}
