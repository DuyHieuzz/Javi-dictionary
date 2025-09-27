package com.example.javi.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "comment")
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

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    Users user;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type", nullable = false)
    EntityType entityType; // Là đã cmt trong word, kanji, grammar

    @Column(name = "entity_id")
    Long entityId; // chỉ lưu id, không FK cứng

    @Column(nullable = false, columnDefinition = "TEXT")
    String content;
}
