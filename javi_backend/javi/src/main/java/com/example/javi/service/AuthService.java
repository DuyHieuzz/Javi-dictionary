package com.example.javi.service;

import java.io.UnsupportedEncodingException;

import jakarta.mail.MessagingException;

import com.example.javi.dto.request.LoginRequest;
import com.example.javi.dto.request.RegisterRequest;
import com.example.javi.dto.response.LoginResponse;
import com.example.javi.dto.response.UserResponse;

public interface AuthService {
    UserResponse register(RegisterRequest request) throws MessagingException, UnsupportedEncodingException;

    LoginResponse login(LoginRequest request, String userAgent);

    LoginResponse loginWithGoogle(String code, String userAgent);

    LoginResponse refreshToken(String refreshToken);

    void logout(String refreshToken);
}
