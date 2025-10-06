package com.example.javi.service;

import com.example.javi.entity.Token;
import com.example.javi.entity.Users;

public interface TokenService {
    Token addToken(Users user, String token, boolean isMobileDevice);

//    Token refreshToken(String refreshToken, Users user) throws Exception;
//
//    Token refreshToken2(String refreshToken);

    Token refreshTokenUnified(String refreshToken);

    void revokeRefreshToken(String refreshToken);
}
