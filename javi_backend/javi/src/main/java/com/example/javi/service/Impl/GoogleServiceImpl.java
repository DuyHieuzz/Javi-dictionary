package com.example.javi.service.Impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import com.example.javi.dto.response.GoogleTokenResponse;
import com.example.javi.dto.response.GoogleUserInfo;
import com.example.javi.service.GoogleService;

import lombok.AccessLevel;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class GoogleServiceImpl implements GoogleService {
    @NonFinal
    @Value("${google.client-id}")
    private String clientId;

    @NonFinal
    @Value("${google.client-secret}")
    private String clientSecret;

    @NonFinal
    @Value("${google.redirect-uri}")
    private String redirectUri;

    private final RestTemplate restTemplate = new RestTemplate();

    // Đổi authorization code -> access_token
    public GoogleTokenResponse exchangeCodeForToken(String code) {
        String url = "https://oauth2.googleapis.com/token";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
        params.add("code", code);
        params.add("client_id", clientId);
        params.add("client_secret", clientSecret);
        params.add("redirect_uri", redirectUri);
        params.add("grant_type", "authorization_code");

        HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

        ResponseEntity<GoogleTokenResponse> response =
                restTemplate.exchange(url, HttpMethod.POST, request, GoogleTokenResponse.class);

        return response.getBody();
    }

    // Lấy thông tin người dùng từ Google
    public GoogleUserInfo getUserInfo(String accessToken) {
        String url = "https://www.googleapis.com/oauth2/v3/userinfo";

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);

        ResponseEntity<GoogleUserInfo> response =
                restTemplate.exchange(url, HttpMethod.GET, request, GoogleUserInfo.class);

        return response.getBody();
    }

    @Override
    public String buildAuthorizationUrl() {
        String scope = "openid email profile";
        String googleAuthUrl = UriComponentsBuilder.fromUriString("https://accounts.google.com/o/oauth2/v2/auth")
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", scope)
                .queryParam("access_type", "offline")
                .toUriString();
        return googleAuthUrl;
    }
}
