package com.example.javi.service.Impl;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.service.CookieService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class CookieServiceImpl implements CookieService {

    String REFRESH_COOKIE_NAME = "refresh_token";
    String PATH = "/";
    boolean SECURE = true;
    boolean HTTP_ONLY = true;
    String SAME_SITE = "Strict";

    @Override
    @Transactional
    public ResponseCookie createRefreshTokenCookie(String token, long maxAgeSeconds) {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, token)
                .httpOnly(HTTP_ONLY)
                .secure(SECURE)
                .path(PATH)
                .sameSite(SAME_SITE)
                .maxAge(maxAgeSeconds)
                .build();
    }

    @Override
    @Transactional
    public ResponseCookie clearRefreshTokenCookie() {
        return ResponseCookie.from(REFRESH_COOKIE_NAME, "")
                .httpOnly(HTTP_ONLY)
                .secure(SECURE)
                .path(PATH)
                .sameSite(SAME_SITE)
                .maxAge(0)
                .build();
    }
}
