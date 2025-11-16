package com.example.javi.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "history_search")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HistorySearch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    Users user;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type")
    EntityType entityType; // tra từ hay kanji hay ngữ pháp

    @Column(name = "entity_id")
    Long entityId; // id của từ hoặc kanji hay ngữ pháp

    @Column(name = "entity_name")
    String entityName;

    String keyword; // tra từ, kanji, ngữ pháp

    @Column(name = "searched_at", nullable = false)
    LocalDateTime searchedAt;

    @PrePersist
    protected void onSearch() {
        searchedAt = LocalDateTime.now();
    }
}
