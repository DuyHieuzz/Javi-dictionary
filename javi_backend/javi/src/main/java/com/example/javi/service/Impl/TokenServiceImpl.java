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

    // 2 method này không đúng logic và không an toàn như mong muốn, cứ để đây sau xem lại

    //    @Override
    //    @Transactional
    //    public Token refreshToken(String refreshToken, Users user) throws Exception {
    //        Token existingToken = tokenRepository
    //                .findByRefreshToken(refreshToken)
    //                .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));
    //
    //        // Kiểm tra thời gian hết hạn của refresh token
    //        if (existingToken.getRefreshExpirationDate().compareTo(LocalDateTime.now()) < 0) {
    //            // Nếu refresh token đã hết hạn, xóa và thông báo lỗi
    //            tokenRepository.delete(existingToken);
    //            throw new AppException(ErrorCode.REFRESH_TOKEN_HAS_EXPIRED);
    //        }
    //
    //        // Tạo JWT mới
    //        String newJwt = securityUtil.generateToken(user);
    //        LocalDateTime expirationDateTime = LocalDateTime.now().plusSeconds(VALID_DURATION);
    //        LocalDateTime newRefreshTokenExpiry = LocalDateTime.now().plusSeconds(REFRESHABLE_DURATION);
    //
    //        // Cập nhật thông tin token
    //        existingToken.setExpirationDate(expirationDateTime);
    //        existingToken.setToken(newJwt);
    //        existingToken.setRefreshToken(UUID.randomUUID().toString()); // Tạo Refresh Token mới
    //        existingToken.setRefreshExpirationDate(newRefreshTokenExpiry);
    //
    //        return tokenRepository.save(existingToken);
    //    }
    //
    //    @Override
    //    @Transactional
    //    public Token refreshToken2(String refreshToken) {
    //        Token existingToken = tokenRepository
    //                .findByRefreshToken(refreshToken)
    //                .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));
    //
    //        if (existingToken.isRevoked()) {
    //            throw new AppException(ErrorCode.REFRESH_TOKEN_REVOKED);
    //        }
    //
    //        if (existingToken.getRefreshExpirationDate().isBefore(LocalDateTime.now())) {
    //            existingToken.setRevoked(true);
    //            tokenRepository.save(existingToken);
    //            throw new AppException(ErrorCode.REFRESH_TOKEN_HAS_EXPIRED);
    //        }
    //
    //        Users user = existingToken.getUser();
    //
    //        // Tạo token mới
    //        String newJwt = securityUtil.generateToken(user);
    //        LocalDateTime expirationDateTime = LocalDateTime.now().plusSeconds(VALID_DURATION);
    //        LocalDateTime newRefreshTokenExpiry = LocalDateTime.now().plusSeconds(REFRESHABLE_DURATION);
    //
    //        // Revoke token cũ
    //        existingToken.setRevoked(true);
    //        tokenRepository.save(existingToken);
    //
    //        // Tạo token mới
    //        Token newToken = Token.builder()
    //                .user(user)
    //                .token(newJwt)
    //                .refreshToken(UUID.randomUUID().toString())
    //                .expirationDate(expirationDateTime)
    //                .refreshExpirationDate(newRefreshTokenExpiry)
    //                .revoked(false)
    //                .expired(false)
    //                .build();
    //
    //        return tokenRepository.save(newToken);
    //    }

    @Override
    @Transactional
    public Token refreshTokenUnified(String refreshToken) {
        Token existingToken = tokenRepository
                .findByRefreshToken(refreshToken)
                .orElseThrow(() -> new AppException(ErrorCode.REFRESH_TOKEN_NOT_FOUND));

        if (existingToken.isRevoked()) {
            throw new AppException(ErrorCode.REFRESH_TOKEN_REVOKED);
        }

        if (existingToken.getRefreshExpirationDate().isBefore(LocalDateTime.now())) {
            existingToken.setRevoked(true);
            tokenRepository.save(existingToken);
            throw new AppException(ErrorCode.REFRESH_TOKEN_HAS_EXPIRED);
        }

        Users user = existingToken.getUser();

        // Update token hiện có (không tạo bản ghi mới)
        String newJwt = securityUtil.generateToken(user);
        LocalDateTime now = LocalDateTime.now();

        existingToken.setToken(newJwt);
        existingToken.setExpirationDate(now.plusSeconds(VALID_DURATION));
        existingToken.setRefreshToken(UUID.randomUUID().toString());
        existingToken.setRefreshExpirationDate(now.plusSeconds(REFRESHABLE_DURATION));
        existingToken.setRevoked(false);
        existingToken.setExpired(false);

        return tokenRepository.save(existingToken);
    }

    @Override
    public void revokeRefreshToken(String refreshToken) {
        tokenRepository.findByRefreshToken(refreshToken).ifPresent(token -> {
            token.setRevoked(true);
            tokenRepository.save(token);
        });
    }
}
