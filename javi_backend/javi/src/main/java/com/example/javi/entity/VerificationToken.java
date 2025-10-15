package com.example.javi.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Entity
@Table(name = "verification_token", uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "token_type"}))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class VerificationToken { // bảng này để xác thực email, reset-password....
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    Long id;

    @Column(nullable = false, unique = true)
    String token;

    @ManyToOne
    @JoinColumn(name = "user_id", referencedColumnName = "id", nullable = false)
    Users user;

    @Column(nullable = false)
    LocalDateTime expirationDate;

    @Column(nullable = false)
    boolean used = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "token_type", nullable = false)
    TokenType tokenType;
}
