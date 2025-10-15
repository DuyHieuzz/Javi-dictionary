package com.example.javi.service.Impl;

import java.time.LocalDateTime;
import java.util.UUID;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.example.javi.entity.Users;
import com.example.javi.entity.VerificationToken;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.repository.UsersRepository;
import com.example.javi.repository.VerificationTokenRepository;
import com.example.javi.service.VerificationTokenService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@Service
@Slf4j
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class VerificationTokenServiceImpl implements VerificationTokenService {
    VerificationTokenRepository verificationTokenRepository;
    UsersRepository usersRepository;
    JavaMailSender mailSender;
    TemplateEngine templateEngine;

    @NonFinal
    @Value("${app.verification.token-expiration-minutes}")
    Long TOKEN_EXPIRATION_MINUTES;

    @Override
    @Transactional
    public VerificationToken createVerificationTokenForUser(Users user) {
        // xóa token cũ cho user (optional)
        verificationTokenRepository.deleteByUser(user);
        String token = UUID.randomUUID().toString();
        VerificationToken vt = new VerificationToken();
        vt.setToken(token);
        vt.setUser(user);
        vt.setExpirationDate(LocalDateTime.now().plusMinutes(TOKEN_EXPIRATION_MINUTES));
        vt.setUsed(false);
        return verificationTokenRepository.save(vt);
    }

    @Override
    @Async
    @Retryable(
            value = {MailException.class, MessagingException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 5000)) // 5 giây giữa các lần thử
    @Transactional
    public void sendVerificationEmail(Users user, VerificationToken token) throws MessagingException {
        // hashcode để test sau build fe sửa lại sau
        String verifyUrl = "http://localhost:5173/verify?token=" + token.getToken();
        // build Thymeleaf context
        Context context = new Context();
        context.setVariable("name", user.getEmail()); // nếu có
        context.setVariable("verificationUrl", verifyUrl);
        context.setVariable("expiryMinutes", TOKEN_EXPIRATION_MINUTES);

        String html = templateEngine.process("email/verification", context);

        MimeMessage mime = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mime, "utf-8");
        helper.setText(html, true);
        helper.setTo(user.getEmail());
        helper.setSubject("Xác minh tài khoản");
        helper.setFrom("Javi-support@gmail.com");

        mailSender.send(mime);

        log.info("[EMAIL SENT] Đã gửi mail xác minh đến: {}", user.getEmail());
    }

    // Gửi email thất bại sau 3 lần retry → chạy vào đây
    @Recover
    public void recoverFromMailFailure(MailException e, Users user, VerificationToken token) {
        log.error("[EMAIL ERROR] Gửi email xác minh thất bại cho user: {}. Lý do: {}", user.getEmail(), e.getMessage());
    }

    @Override
    @Transactional
    public void verifyToken(String token) {
        VerificationToken vt = verificationTokenRepository
                .findByToken(token)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        if (vt.isUsed() || vt.getExpirationDate().isBefore(LocalDateTime.now())) {
            throw new AppException(ErrorCode.TOKEN_HAS_EXPIRED);
        }

        Users user = vt.getUser();
        user.setVerified(true);
        usersRepository.save(user);

        vt.setUsed(true);
        verificationTokenRepository.save(vt);
    }

    @Override
    @Transactional
    public void resendVerification(String email) throws MessagingException {
        Users user = usersRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.isVerified()) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }
        VerificationToken vt = createVerificationTokenForUser(user);
        sendVerificationEmail(user, vt);
    }
}
