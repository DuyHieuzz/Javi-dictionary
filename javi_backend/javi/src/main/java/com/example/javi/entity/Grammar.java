package com.example.javi.entity;

import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Entity
@Table(name = "grammar")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Grammar extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "grammar_id")
    Long grammarId;

    @Column(nullable = false)
    String pattern; //mẫu câu ngữ pháp

    @Column(nullable = false, columnDefinition = "TEXT")
    String meaning; //nghĩa khi dịch ngữ pháp

    @Column(nullable = false)
    String structure; //cách chia ngữ pháp

    @Column(nullable = false, columnDefinition = "TEXT")
    String explanation; //phạm vị sử dụng

    @Enumerated(EnumType.STRING)
    JlptLevel level;

    @OneToMany(mappedBy = "grammar", cascade = CascadeType.ALL)
    List<GrammarExample> examples;
}
