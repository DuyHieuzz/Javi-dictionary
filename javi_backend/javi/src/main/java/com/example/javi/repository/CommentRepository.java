package com.example.javi.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.Comment;
import com.example.javi.entity.EntityType;
import com.example.javi.entity.Users;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long>, JpaSpecificationExecutor<Comment> {
    Page<Comment> findByEntityTypeAndEntityId(EntityType entityType, Long entityId, Pageable pageable);

    //    List<Comment> findByEntityTypeAndEntityIdOrderByLikeCountDesc(EntityType entityType, Long entityId);

    Optional<Comment> findByEntityTypeAndEntityIdAndUser(EntityType entityType, Long entityId, Users user);

    Page<Comment> findByUserOrderByCreatedAtDesc(Users user, Pageable pageable);

    boolean existsByEntityTypeAndEntityIdAndUser(EntityType entityType, Long entityId, Users user);
}
