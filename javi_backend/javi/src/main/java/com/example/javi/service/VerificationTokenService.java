package com.example.javi.service;

import java.io.UnsupportedEncodingException;

import jakarta.mail.MessagingException;

import com.example.javi.dto.request.ResetPassRequest;
import com.example.javi.entity.TokenType;
import com.example.javi.entity.Users;
import com.example.javi.entity.VerificationToken;

public interface VerificationTokenService {
    VerificationToken createVerificationTokenForUser(Users user, TokenType tokenType);

    void sendVerificationEmail(Users user, VerificationToken token)
            throws MessagingException, UnsupportedEncodingException;

    void verifyToken(String token);

    void resendVerification(String email, TokenType tokenType) throws MessagingException, UnsupportedEncodingException;

    void sendPasswordResetEmail(String email);

    void verifyPasswordResetToken(String token);

    void resetPassword(ResetPassRequest resetPassRequest);
}
