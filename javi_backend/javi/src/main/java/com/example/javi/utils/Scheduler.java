package com.example.javi.utils;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.entity.AccountType;
import com.example.javi.entity.Users;
import com.example.javi.repository.TokenRepository;
import com.example.javi.repository.UsersRepository;
import com.example.javi.repository.VerificationTokenRepository;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Component
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class Scheduler {
    UsersRepository usersRepository;
    VerificationTokenRepository verificationTokenRepository;
    TokenRepository tokenRepository;

    // Chạy mỗi ngày lúc 3 giờ sáng
    @Scheduled(cron = "0 0 3 * * *")
    public void downgradeExpiredPremiums() {
        List<Users> expiredUsers =
                usersRepository.findByAccountTypeAndPremiumExpiredAtBefore(AccountType.PREMIUM, LocalDateTime.now());

        for (Users user : expiredUsers) {
            user.setAccountType(AccountType.FREE);
            user.setPremiumType(null);
            user.setPremiumExpiredAt(null);
        }

        if (!expiredUsers.isEmpty()) {
            usersRepository.saveAll(expiredUsers);
            System.out.println("Đã hạ cấp" + expiredUsers.size() + " user hết hạn Premium.");
        }
    }

    @Scheduled(fixedRate = 15 * 60 * 1000) // 15 phút chạy 1 lần
    @Transactional
    public void cleanupExpiredTokens() {
        int beforeCount = (int) verificationTokenRepository.count();
        verificationTokenRepository.deleteAllByExpirationDateBefore(LocalDateTime.now());
        int afterCount = (int) verificationTokenRepository.count();
        log.info("[TOKEN CLEANUP] Đã dọn token hết hạn. Trước: {}, Sau: {}", beforeCount, afterCount);
    }
    /**
     * Chạy mỗi ngày lúc 03:00 sáng,
     * Xóa token có expirationDate trước (now - 10 days).
     */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredAccessTokens() {
        LocalDateTime threshold = LocalDateTime.now().minusDays(10);
        int deleted = tokenRepository.deleteAllByExpirationDateBefore(threshold);
        log.info("[TOKEN CLEANUP] Đã xóa {} token đã hết hạn hơn 10 ngày (ngưỡng: {}).", deleted, threshold);
    }
}
