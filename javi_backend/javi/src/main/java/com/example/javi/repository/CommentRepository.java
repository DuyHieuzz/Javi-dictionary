package com.example.javi.repository;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.Comment;
import com.example.javi.entity.EntityType;
import com.example.javi.entity.Users;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long>, JpaSpecificationExecutor<Comment> {
    @EntityGraph(attributePaths = {"user"})
    Page<Comment> findByEntityTypeAndEntityId(EntityType entityType, Long entityId, Pageable pageable);

    //    List<Comment> findByEntityTypeAndEntityIdOrderByLikeCountDesc(EntityType entityType, Long entityId);

    // Chỉ lấy comment của user chưa bị block
    @EntityGraph(attributePaths = {"user"})
    @Query(
            "SELECT c FROM Comment c WHERE c.entityType = :entityType AND c.entityId = :entityId AND c.user.status <> 'BLOCKED'")
    Page<Comment> findVisibleByEntityTypeAndEntityId(
            @Param("entityType") EntityType entityType, @Param("entityId") Long entityId, Pageable pageable);

    // Lấy toàn bộ comment nhưng loại bỏ user bị block
    @EntityGraph(attributePaths = {"user"})
    @Query("SELECT c FROM Comment c WHERE c.user.status <> 'BLOCKED'")
    Page<Comment> findAllVisible(Pageable pageable);

    Optional<Comment> findByEntityTypeAndEntityIdAndUser(EntityType entityType, Long entityId, Users user);

    Page<Comment> findByUserOrderByCreatedAtDesc(Users user, Pageable pageable);

    boolean existsByEntityTypeAndEntityIdAndUser(EntityType entityType, Long entityId, Users user);
}
