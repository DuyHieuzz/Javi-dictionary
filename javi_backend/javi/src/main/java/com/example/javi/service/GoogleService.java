package com.example.javi.service;

import com.example.javi.dto.response.GoogleTokenResponse;
import com.example.javi.dto.response.GoogleUserInfo;

public interface GoogleService {
    GoogleTokenResponse exchangeCodeForToken(String code);

    GoogleUserInfo getUserInfo(String accessToken);

    String buildAuthorizationUrl();
}
