package com.example.javi.service.Impl;

import java.io.UnsupportedEncodingException;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.UUID;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationContext;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Recover;
import org.springframework.retry.annotation.Retryable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.example.javi.dto.request.ResetPassRequest;
import com.example.javi.entity.Status;
import com.example.javi.entity.TokenType;
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
    PasswordEncoder passwordEncoder;
    ApplicationContext applicationContext; // dùng tạm để retryable có thể chạy mà không phải tạo class bean khác

    @NonFinal
    @Value("${app.verification.token-expiration-minutes}")
    Long EMAIL_VERIFICATION_EXPIRATION_MINUTES;

    @NonFinal
    @Value("${app.verification.reset-password-token-expiration-minutes}")
    Long RESET_PASSWORD_EXPIRATION_MINUTES;

    @NonFinal
    @Value("${app.frontend.base-url}")
    String FRONTEND_BASE_URL;

    @NonFinal
    @Value("${spring.mail.username}")
    String MAIL_FROM;

    @NonFinal
    @Value("${app.time-zone}")
    String TIME_ZONE;

    private ZoneId getZoneId() {
        return ZoneId.of(TIME_ZONE);
    }

    @Override
    @Transactional
    public VerificationToken createVerificationTokenForUser(Users user, TokenType tokenType) {
        // xóa token cũ cho user (optional)
        verificationTokenRepository.deleteByUserAndTokenType(user, tokenType);

        String token = UUID.randomUUID().toString();
        VerificationToken vt = new VerificationToken();
        vt.setToken(token);
        vt.setUser(user);

        long minutes =
                switch (tokenType) {
                    case RESET_PASSWORD -> RESET_PASSWORD_EXPIRATION_MINUTES != null
                            ? RESET_PASSWORD_EXPIRATION_MINUTES
                            : EMAIL_VERIFICATION_EXPIRATION_MINUTES;
                    case EMAIL_VERIFICATION -> EMAIL_VERIFICATION_EXPIRATION_MINUTES;
                };

        vt.setExpirationDate(LocalDateTime.now(getZoneId()).plusMinutes(minutes));
        vt.setUsed(false);
        vt.setTokenType(tokenType);

        return verificationTokenRepository.save(vt);
    }

    /**
     * Async wrapper: gọi method có @Retryable để đảm bảo retry hoạt động,
     * đồng thời gửi bất đồng bộ khỏi luồng request.
     */
    @Override
    @Async
    @Transactional
    public void sendVerificationEmail(Users user, VerificationToken token)
            throws MessagingException, UnsupportedEncodingException {
        // gọi method thực sự có retry
        applicationContext.getBean(VerificationTokenServiceImpl.class).sendVerificationEmailWithRetry(user, token);
    }

    /**
     * Method thực tế gửi mail, annotation @Retryable được gắn ở đây (không @Async),
     * đảm bảo retry/recover hoạt động đúng.
     */
    @Retryable(
            value = {MailException.class, MessagingException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 5000)) // 5 giây giữa các lần thử
    @Transactional
    public void sendVerificationEmailWithRetry(Users user, VerificationToken token)
            throws MessagingException, UnsupportedEncodingException {
        String verifyUrl = FRONTEND_BASE_URL + "/verify?token=" + token.getToken();
        Context context = new Context();
        context.setVariable("name", user.getEmail());
        context.setVariable("verificationUrl", verifyUrl);
        context.setVariable("expiryMinutes", EMAIL_VERIFICATION_EXPIRATION_MINUTES);

        String html = templateEngine.process("email/verification", context);

        MimeMessage mime = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mime, "utf-8");
        helper.setText(html, true);
        helper.setTo(user.getEmail());
        helper.setSubject("Xác minh tài khoản");
        helper.setFrom(MAIL_FROM, "Javi Support");

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
                .findByTokenAndTokenType(token, TokenType.EMAIL_VERIFICATION)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        if (vt.isUsed() || vt.getExpirationDate().isBefore(LocalDateTime.now(getZoneId()))) {
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
    public void resendVerification(String email, TokenType tokenType)
            throws MessagingException, UnsupportedEncodingException {
        Users user = usersRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.isVerified()) {
            throw new AppException(ErrorCode.EMAIL_ALREADY_VERIFIED);
        }
        VerificationToken vt = createVerificationTokenForUser(user, tokenType);
        // gọi async wrapper (vẫn sẽ retry trong hàm thực tế)
        sendVerificationEmail(user, vt);
    }

    /**
     * Gửi mail reset mật khẩu:
     * - Tách retry vào method không-async giống pattern phía trên.
     */
    @Override
    @Transactional
    public void sendPasswordResetEmail(String email) {
        Users user = usersRepository.findByEmail(email).orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));

        if (user.getStatus() == Status.BLOCKED) {
            throw new AppException(ErrorCode.YOUR_ACCOUNT_HAS_BEEN_BLOCK);
        }

        verificationTokenRepository.deleteByUserAndTokenType(user, TokenType.RESET_PASSWORD);

        VerificationToken token = createVerificationTokenForUser(user, TokenType.RESET_PASSWORD);

        String resetUrl = FRONTEND_BASE_URL + "/reset-password?token=" + token.getToken();
        Context context = new Context();
        context.setVariable("name", user.getEmail());
        context.setVariable("resetUrl", resetUrl);
        context.setVariable(
                "expiryMinutes",
                RESET_PASSWORD_EXPIRATION_MINUTES != null
                        ? RESET_PASSWORD_EXPIRATION_MINUTES
                        : EMAIL_VERIFICATION_EXPIRATION_MINUTES);

        // gọi async wrapper
        sendPasswordResetEmailAsync(user, token, context);
    }

    // async wrapper để gửi reset mail
    @Async
    public void sendPasswordResetEmailAsync(Users user, VerificationToken token, Context context) {
        try {
            applicationContext
                    .getBean(VerificationTokenServiceImpl.class)
                    .sendPasswordResetEmailWithRetry(user, token, context);
        } catch (Exception e) {
            log.error(
                    "[EMAIL ERROR] Gửi email reset mật khẩu thất bại cho user {}: {}", user.getEmail(), e.getMessage());
        }
    }

    // method thực hiện gửi có retry
    @Retryable(
            value = {MailException.class, MessagingException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 5000))
    @Transactional
    public void sendPasswordResetEmailWithRetry(Users user, VerificationToken token, Context context)
            throws MessagingException, UnsupportedEncodingException {

        context.setVariable(
                "expiryMinutes",
                RESET_PASSWORD_EXPIRATION_MINUTES != null
                        ? RESET_PASSWORD_EXPIRATION_MINUTES
                        : EMAIL_VERIFICATION_EXPIRATION_MINUTES);

        String html = templateEngine.process("email/reset-password", context);

        MimeMessage mime = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(mime, "utf-8");
        helper.setText(html, true);
        helper.setTo(user.getEmail());
        helper.setSubject("Đặt lại mật khẩu");
        helper.setFrom(MAIL_FROM, "Javi Support");
        mailSender.send(mime);

        log.info("[EMAIL SENT] Đã gửi mail reset mật khẩu đến: {}", user.getEmail());
    }

    @Recover
    public void recoverFromResetMailFailure(MailException e, Users user, VerificationToken token, Context context) {
        log.error(
                "[EMAIL ERROR] Gửi email reset mật khẩu thất bại cho user: {}. Lý do: {}",
                user.getEmail(),
                e.getMessage());
    }

    @Override
    @Transactional(readOnly = true)
    public void verifyPasswordResetToken(String token) {
        VerificationToken vt = verificationTokenRepository
                .findByTokenAndTokenType(token, TokenType.RESET_PASSWORD)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        if (vt.isUsed() || vt.getExpirationDate().isBefore(LocalDateTime.now(getZoneId()))) {
            throw new AppException(ErrorCode.TOKEN_HAS_EXPIRED);
        }
    }

    @Override
    @Transactional
    public void resetPassword(ResetPassRequest resetPassRequest) {
        if (!resetPassRequest.getNewPassword().equals(resetPassRequest.getConfirmPassword())) {
            throw new AppException(ErrorCode.MISMATCH_PASSWORD);
        }
        VerificationToken vt = verificationTokenRepository
                .findByTokenAndTokenType(resetPassRequest.getToken(), TokenType.RESET_PASSWORD)
                .orElseThrow(() -> new AppException(ErrorCode.INVALID_TOKEN));

        if (vt.isUsed() || vt.getExpirationDate().isBefore(LocalDateTime.now(getZoneId()))) {
            throw new AppException(ErrorCode.TOKEN_HAS_EXPIRED);
        }

        Users user = vt.getUser();
        user.setPassword(passwordEncoder.encode(resetPassRequest.getNewPassword()));
        usersRepository.save(user);

        vt.setUsed(true);
        verificationTokenRepository.save(vt);
    }
}
