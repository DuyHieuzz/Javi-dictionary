package com.example.javi.service.Impl;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.entity.Token;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.repository.TokenRepository;
import com.example.javi.service.TokenService;
import com.example.javi.utils.SecurityUtil;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class TokenServiceImpl implements TokenService {
    private static final int MAX_TOKENS = 3;

    @Value("${jwt.valid-duration}")
    @NonFinal
    int VALID_DURATION;

    @Value("${jwt.refreshable-duration}")
    @NonFinal
    int REFRESHABLE_DURATION;

    TokenRepository tokenRepository;
    SecurityUtil securityUtil;

    @Override
    @Transactional
    public Token addToken(Users user, String token, boolean isMobileDevice) {
        // Lấy danh sách token hiện tại và sắp xếp theo ngày hết hạn (cũ nhất lên đầu)
        List<Token> userTokens = tokenRepository.findByUser(user);
        int tokenCount = userTokens.size();

        if (tokenCount >= MAX_TOKENS) {
            // 1. Tách danh sách thành Mobile và Non-Mobile
            List<Token> nonMobileTokens = userTokens.stream()
                    .filter(userToken -> !userToken.isMobile())
                    .sorted(Comparator.comparing(Token::getExpirationDate)) // Sắp xếp theo ExpirationDate (cũ nhất)
                    .collect(Collectors.toList());

            List<Token> mobileTokens = userTokens.stream()
                    .filter(Token::isMobile)
                    .sorted(Comparator.comparing(Token::getExpirationDate)) // Sắp xếp theo ExpirationDate (cũ nhất)
                    .collect(Collectors.toList());

            Token tokenToDelete = null;

            // 2. Ưu tiên xóa Non-Mobile cũ nhất
            if (!nonMobileTokens.isEmpty()) {
                tokenToDelete = nonMobileTokens.get(0); // Lấy token Non-Mobile cũ nhất
            } else if (!mobileTokens.isEmpty()) {
                // 3. Nếu tất cả là Mobile, xóa Mobile cũ nhất
                tokenToDelete = mobileTokens.get(0);
            }

            if (tokenToDelete != null) {
                tokenRepository.delete(tokenToDelete);
                log.info("Token exceeded MAX_TOKENS limit (3). Deleted token ID: {}", tokenToDelete.getId());
            }
        }

        // Tạo mới một token cho người dùng
        long expirationInSeconds = VALID_DURATION;
        LocalDateTime expirationDateTime = LocalDateTime.now().plusSeconds(expirationInSeconds);

        Token newToken = Token.builder()
                .user(user)
                .token(token)
                .revoked(false)
                .expired(false)
                .tokenType("Bearer")
                .expirationDate(expirationDateTime)
                .isMobile(isMobileDevice)
                .build();

        newToken.setRefreshToken(UUID.randomUUID().toString());
        newToken.setRefreshExpirationDate(LocalDateTime.now().plusSeconds(REFRESHABLE_DURATION));

        return tokenRepository.save(newToken);
    }

    @Override
    @Transactional
    public Token refreshTokenUnified(String refreshToken) {
        Token existingToken = tokenRepository
                .findByRefreshToken(refreshToken)
                .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (existingToken.isRevoked() || existingToken.isExpired()) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_REUSED);
        }

        if (existingToken.getRefreshExpirationDate().isBefore(LocalDateTime.now())) {
            existingToken.setRevoked(true);
            existingToken.setExpired(true);
            tokenRepository.save(existingToken);
            throw new AppException(ErrorCode.REFRESH_TOKEN_HAS_EXPIRED);
        }

        // Revoke cặp cũ (access + refresh)
        existingToken.setRevoked(true);
        existingToken.setExpired(true);
        tokenRepository.save(existingToken);

        Users user = existingToken.getUser();
        LocalDateTime now = LocalDateTime.now();

        // Tạo cặp token mới cho thiết bị này
        String newAccessToken = securityUtil.generateToken(user);
        String newRefreshToken = UUID.randomUUID().toString();

        Token newToken = Token.builder()
                .user(user)
                .token(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expirationDate(now.plusSeconds(VALID_DURATION))
                .refreshExpirationDate(now.plusSeconds(REFRESHABLE_DURATION))
                .revoked(false)
                .expired(false)
                .isMobile(existingToken.isMobile())
                .build();

        tokenRepository.save(newToken);

        // Cleanup token rác (revoked + expired)
        cleanupOldTokens(user);
        return newToken;
    }

    @Override
    @Transactional
    public void revokeRefreshToken(String refreshToken) {
        tokenRepository.findByRefreshToken(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            token.setExpired(true);
            tokenRepository.save(token);
        });
    }

    @Override
    @Transactional
    public void cleanupOldTokens(Users user) {
        List<Token> oldTokens = tokenRepository.findByUser(user).stream()
                .filter(t -> t.isRevoked() && t.isExpired())
                .collect(Collectors.toList());

        if (!oldTokens.isEmpty()) {
            tokenRepository.deleteAll(oldTokens);
        }
    }
}
