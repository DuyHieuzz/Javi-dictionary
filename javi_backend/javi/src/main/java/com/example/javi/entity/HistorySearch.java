package com.example.javi.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;

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

    @ManyToOne
    @JoinColumn(name = "userId")
    Users user;

    @Enumerated(EnumType.STRING)
    @Column(name = "entity_type")
    EntityType entityType; //tra từ hay kanji hay ngữ pháp

    @Column(name = "entity_id")
    Long entityId; // id của từ hoặc kanji hay ngữ pháp

    @Column(nullable = false)
    String content; //tra từ, kanji, ngữ pháp nên không cần kiểu text

    @Column(name = "searched_at")
    LocalDate searchedAt;

    @PrePersist
    protected void onSearch() {
        searchedAt = LocalDate.now();
    }
}
