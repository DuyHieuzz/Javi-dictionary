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
    String word; //từ vựng cần tra

    String romaji;//cách đọc romaji
    String hiragana;//cách đọc hiragane
    String katakana;//cách đọc katakana
    @Enumerated(EnumType.STRING)
    @Column(name = "word_type")
    WordType wordType;//từ loại danh từ, tính từ...

    @Enumerated(EnumType.STRING)
    JlptLevel level;

    @ManyToMany
    @JoinTable(
            name = "vocabulary_kanji",
            joinColumns = @JoinColumn(name = "vocab_id"),
            inverseJoinColumns = @JoinColumn(name = "kanji_id")
    )
    private List<Kanji> kanjis;

    @OneToMany(mappedBy = "vocabularies", cascade = CascadeType.ALL)
    List<Meaning> meanings;

}
