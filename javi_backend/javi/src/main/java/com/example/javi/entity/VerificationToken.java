package com.example.javi.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "verification_token")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VerificationToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, unique = true)
    String token;

    @OneToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    Users user;

    @Column(nullable = false)
    LocalDateTime expirationDate;

    @Column(nullable = false)
    boolean used = false;
}
