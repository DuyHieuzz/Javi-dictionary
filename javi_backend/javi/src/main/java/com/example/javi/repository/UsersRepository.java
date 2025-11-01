package com.example.javi.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import com.example.javi.entity.AccountType;
import com.example.javi.entity.Users;

@Repository
public interface UsersRepository extends JpaRepository<Users, Long>, JpaSpecificationExecutor<Users> {
    boolean existsByEmail(String email);

    boolean existsByUsername(String username);

    Optional<Users> findByEmail(String email);

    Optional<Users> findByUsername(String userName);

    List<Users> findByAccountTypeAndPremiumExpiredAtBefore(AccountType accountType, LocalDateTime time);

    Optional<Users> findByGoogleAccountId(String googleId);
}
