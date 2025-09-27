package com.example.javi.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "grammar_example")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GrammarExample extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(name = "ja_sentence", columnDefinition = "TEXT")
    String jaSentence; //câu ví dụ tiếng nhật
    @Column(name = "vi_sentence", columnDefinition = "TEXT")
    String viSentence; //câu ví dụ tiếng việt

    @ManyToOne
    @JoinColumn(name = "grammar_id")
    Grammar grammar;
}
