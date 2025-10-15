package com.example.javi.service;

import jakarta.mail.MessagingException;

import com.example.javi.entity.Users;
import com.example.javi.entity.VerificationToken;

public interface VerificationTokenService {
    VerificationToken createVerificationTokenForUser(Users user);

    void sendVerificationEmail(Users user, VerificationToken token) throws MessagingException;

    void verifyToken(String token);

    void resendVerification(String email) throws MessagingException;
}
