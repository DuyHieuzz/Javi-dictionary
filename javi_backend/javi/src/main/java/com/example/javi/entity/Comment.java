package com.example.javi.entity;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Comment extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    Users user;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    EntityType entityType; // Là đã cmt trong word, kanji, grammar

    @Column(name = "entity_id")
    Long entityId; // chỉ lưu id, không FK cứng, id của từ vựng, kanji, ngữ pháp

    @Column(nullable = false)
    private String entityName;

    @Column(nullable = false, columnDefinition = "TEXT")
    String content;

    @Column(name = "like_count")
    int likeCount = 0;

    @Column(name = "dislike_count")
    int dislikeCount = 0;
}
