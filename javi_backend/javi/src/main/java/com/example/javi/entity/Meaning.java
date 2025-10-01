package com.example.javi.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

@Entity
@Table(name = "meaning")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class Meaning extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @ManyToOne
    @JoinColumn(name = "vocab_id", nullable = false)
    @JsonBackReference
    Vocabularies vocabularies;

    @Column(nullable = false)
    String meaningVn;//nghĩa tiengsr việt

    @Column(columnDefinition = "TEXT")
    String description;//mô tả thêm cho nghĩa tiếng việt, (nếu có)

    @OneToMany(mappedBy = "meaning", cascade = CascadeType.ALL)
    @JsonManagedReference
    List<MeaningExample> examples;
}
