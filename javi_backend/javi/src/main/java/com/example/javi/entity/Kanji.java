package com.example.javi.entity;


import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

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
    String characterName;

    @Column(nullable = false, name = "sino_vi_name")
    String sinoViName;
    String romaji;
    String meaning;

    @Enumerated(EnumType.STRING)
    jlptLevel level;

    @ManyToMany(mappedBy = "kanjis")
    List<Vocabularies> vocabularies;
}

