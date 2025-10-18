package com.example.javi.service;

import org.springframework.http.ResponseCookie;

public interface CookieService {
    ResponseCookie createRefreshTokenCookie(String token, long maxAgeSeconds);

    ResponseCookie clearRefreshTokenCookie();
}
