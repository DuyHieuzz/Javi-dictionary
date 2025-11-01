package com.example.javi.entity;

import java.util.List;

import jakarta.persistence.*;

import com.fasterxml.jackson.annotation.JsonIgnore;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "Kanji")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Kanji extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "kanji_id")
    Long Id;

    @Column(name = "character_name", nullable = false)
    String characterName; // tra kanji nào

    @Column(name = "sino_vi_name")
    String sinoViName; // nghĩa hán tự, nghĩa hán việt

    // cách đọc romaji
    // String romaji;

    @Column(columnDefinition = "TEXT")
    String meaning; // nghĩa chính

    @Enumerated(EnumType.STRING)
    JlptLevel level;

    @Column(name = "gif_url")
    String gifUrl;

    @ManyToMany(mappedBy = "kanjis")
    @JsonIgnore
    List<Vocabularies> vocabularies;
}
