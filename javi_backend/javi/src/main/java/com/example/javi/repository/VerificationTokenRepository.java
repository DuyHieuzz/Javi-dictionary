package com.example.javi.repository;

import java.time.LocalDateTime;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.entity.Users;
import com.example.javi.entity.VerificationToken;

public interface VerificationTokenRepository extends JpaRepository<VerificationToken, Long> {
    Optional<VerificationToken> findByToken(String token);

    Optional<VerificationToken> findTopByUserOrderByExpirationDateDesc(Users user);

    void deleteByUser(Users user);

    @Modifying
    @Transactional
    void deleteAllByExpirationDateBefore(LocalDateTime time);
}
