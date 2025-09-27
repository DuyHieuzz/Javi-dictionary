package com.example.javi.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Entity
@Table(name = "vocabularies")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Vocabularies extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "vocab_id")
    Long vocabId;

    @Column(nullable = false)
    String word;

    String romaji;
    String hiragana;
    String katakana;

    String wordType;

    String scriptType;

    @Enumerated(EnumType.STRING)
    jlptLevel level;

    @ManyToMany
    @JoinTable(
            name = "vocabulary_kanji",
            joinColumns = @JoinColumn(name = "vocab_id"),
            inverseJoinColumns = @JoinColumn(name = "kanji_id")
    )
    private List<Kanji> kanjis;
}
