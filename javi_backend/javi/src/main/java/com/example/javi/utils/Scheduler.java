package com.example.javi.utils;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.example.javi.entity.AccountType;
import com.example.javi.entity.Users;
import com.example.javi.repository.UsersRepository;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class Scheduler {
    private final UsersRepository usersRepository;

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
}
