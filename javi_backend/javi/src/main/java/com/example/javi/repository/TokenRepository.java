package com.example.javi.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.entity.Token;
import com.example.javi.entity.Users;

public interface TokenRepository extends JpaRepository<Token, Long> {
    List<Token> findByUser(Users user);

    Token findByToken(String token);

    Optional<Token> findByRefreshToken(String token);

    @Modifying
    @Query("UPDATE Token t SET t.revoked = true, t.expired = true WHERE t.user.id = :userId")
    void revokeAllByUserId(Long userId);

    @Modifying
    @Transactional
    @Query("DELETE FROM Token t WHERE t.expirationDate < :threshold")
    int deleteAllByExpirationDateBefore(LocalDateTime threshold);
}
