package com.example.javi.controller;

import java.io.UnsupportedEncodingException;
import java.util.Map;

import jakarta.mail.MessagingException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.request.LoginRequest;
import com.example.javi.dto.request.ResetPassRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.LoginResponse;
import com.example.javi.dto.response.UserResponse;
import com.example.javi.entity.TokenType;
import com.example.javi.service.*;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/auth")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class AuthController {
    VerificationTokenService verificationTokenService;
    AuthService authService;
    CookieService cookieService;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    int refreshableDuration;

    @PostMapping("/register")
    public ApiResponse<UserResponse> register(@Valid @RequestBody CreateUserRequest request)
            throws MessagingException, UnsupportedEncodingException {

        return ApiResponse.<UserResponse>builder()
                .message("Đăng ký thành công! Vui lòng kiểm tra email để xác minh tài khoản.")
                .result(authService.register(request))
                .build();
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        String userAgent = httpRequest.getHeader("User-Agent");
        LoginResponse result = authService.login(request, userAgent);

        ResponseCookie cookie = cookieService.createRefreshTokenCookie(result.getRefreshToken(), refreshableDuration);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(result);
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refreshToken(
            @CookieValue(value = "refresh_token", required = false) String refreshToken) {
        LoginResponse result = authService.refreshToken(refreshToken);

        ResponseCookie cookie = cookieService.createRefreshTokenCookie(result.getRefreshToken(), refreshableDuration);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(result);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@CookieValue(value = "refresh_token", required = false) String refreshToken) {
        authService.logout(refreshToken);

        ResponseCookie cookie = cookieService.clearRefreshTokenCookie();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(Map.of("message", "Đăng xuất thành công"));
    }

    @GetMapping("/verify-email")
    public ApiResponse<Void> verify(@RequestParam("token") String token) {
        verificationTokenService.verifyToken(token);
        return ApiResponse.<Void>builder().message("Xác thực thành công").build();
    }

    // Nếu token hết hạn, chưa verify mà user đăng nhập sẽ báo lỗi và FE sẽ hiển thị nút để gửi lại token cho verify lại
    @PostMapping("/resend-verification")
    public ApiResponse<Void> resend(@RequestParam String email)
            throws MessagingException, UnsupportedEncodingException {
        verificationTokenService.resendVerification(email, TokenType.EMAIL_VERIFICATION);
        return ApiResponse.<Void>builder().message("Xác thực thành công").build();
    }

    @PostMapping("/forgot-password")
    public ApiResponse<Void> forgotPassword(@RequestParam String email) {
        verificationTokenService.sendPasswordResetEmail(email);
        return ApiResponse.<Void>builder()
                .message("Đã gửi email khôi phục mật khẩu. Kiểm tra hòm thư hoặc mục spam trong gmail của bạn.")
                .build();
    }

    @GetMapping("/verify-reset-token")
    public ApiResponse<Void> verifyResetToken(@RequestParam String token) {
        verificationTokenService.verifyPasswordResetToken(token);
        return ApiResponse.<Void>builder()
                .message("Token hợp lệ. Cho phép đặt lại mật khẩu.")
                .build();
    }

    @PostMapping("/reset-password")
    public ApiResponse<Void> resetPassword(@RequestBody ResetPassRequest resetPassRequest) {
        verificationTokenService.resetPassword(resetPassRequest);
        return ApiResponse.<Void>builder()
                .message("Đặt lại mật khẩu thành công.")
                .build();
    }
}
