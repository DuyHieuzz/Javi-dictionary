package com.example.javi.entity;

import jakarta.persistence.*;

import lombok.*;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, unique = true)
    String name; // ADD_GRAMMAR, DELETE_COMMENT...

    @Column(columnDefinition = "TEXT")
    String description;

    @Column(nullable = false)
    private boolean isSystemPermission = false;

    public Permission(String name, String description, boolean isSystemPermission) {
        this.name = name;
        this.description = description;
        this.isSystemPermission = isSystemPermission;
    }
}
