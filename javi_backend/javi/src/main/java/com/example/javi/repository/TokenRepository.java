package com.example.javi.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.javi.entity.Token;
import com.example.javi.entity.Users;

public interface TokenRepository extends JpaRepository<Token, Long> {
    List<Token> findByUser(Users user);

    Token findByToken(String token);

    Optional<Token> findByRefreshToken(String token);
}
