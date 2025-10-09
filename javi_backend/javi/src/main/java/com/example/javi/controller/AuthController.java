package com.example.javi.controller;

import java.util.Map;
import java.util.Optional;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.javi.dto.request.LoginRequest;
import com.example.javi.dto.response.LoginResponse;
import com.example.javi.dto.response.UserResponse;
import com.example.javi.entity.Token;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.UsersMapper;
import com.example.javi.repository.UsersRepository;
import com.example.javi.service.TokenService;
import com.example.javi.service.UsersService;
import com.example.javi.utils.SecurityUtil;

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
    UsersService usersService;
    UsersRepository usersRepository;
    AuthenticationManagerBuilder authenticationManagerBuilder;
    UsersMapper usersMapper;
    SecurityUtil securityUtil;
    TokenService tokenService;

    @NonFinal
    @Value("${jwt.refreshable-duration}")
    int refreshableDuration;

    private boolean isMobileDevice(String userAgent) {
        // Kiểm tra User-Agent header để xác định thiết bị di động
        // đơn giản
        return userAgent.toLowerCase().contains("mobile");
    }

    @PostMapping("/login")
    public ResponseEntity login(@Valid @RequestBody LoginRequest loginDto, HttpServletRequest request) {

        // Nạp input gồm email/password vào Security
        UsernamePasswordAuthenticationToken authenticationToken =
                new UsernamePasswordAuthenticationToken(loginDto.getEmail(), loginDto.getPassword());

        // xác thực người dùng
        Authentication authentication = authenticationManagerBuilder.getObject().authenticate(authenticationToken);

        // set thông tin người dùng đăng nhập vào context
        SecurityContextHolder.getContext().setAuthentication(authentication);

        LoginResponse res = new LoginResponse();
        Optional<Users> currentUserDB = this.usersRepository.findByEmail(loginDto.getEmail());
        if (currentUserDB.isEmpty()) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        Users currentUser = currentUserDB.get();
        UserResponse userResponse = usersMapper.toUserResponse(currentUser);

        res.setUser(userResponse);

        // tạo access token
        String token = usersService.login(loginDto);
        res.setToken(token);

        String userAgent = request.getHeader("User-Agent");
        Users userDetail = usersService.getUserDetailsFromToken(token);
        Token jwtToken = tokenService.addToken(userDetail, token, isMobileDevice(userAgent));
        String refreshToken = jwtToken.getRefreshToken();

        res.setRefreshToken(refreshToken);
        res.setTokenType(jwtToken.getTokenType());

        // set cookies
        ResponseCookie resCookies = ResponseCookie.from("refresh_token", refreshToken)
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(refreshableDuration)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, resCookies.toString())
                .body(res);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(HttpServletRequest request, HttpServletResponse response) {
        // Lấy refresh token từ cookie
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refresh_token".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Missing refresh token"));
        }

        try {
            // Gọi service để tạo access token và refresh token mới
            Token newToken = tokenService.refreshTokenUnified(refreshToken);

            // Tạo cookie refresh token mới để gửi lại client
            ResponseCookie newRefreshCookie = ResponseCookie.from("refresh_token", newToken.getRefreshToken())
                    .httpOnly(true)
                    .secure(true) // để false nếu test local HTTP
                    .sameSite("Strict") // hoặc "None" nếu frontend khác domain
                    .path("/")
                    .maxAge(refreshableDuration) // hoặc REFRESHABLE_DURATION
                    .build();

            // Trả access token mới trong body
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, newRefreshCookie.toString())
                    .body(Map.of("access_token", newToken.getToken(), "message", "Refresh token thành công"));

        } catch (AppException e) {
            // token hết hạn hoặc bị revoke
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", e.getErrorCode().getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Có lỗi khi làm mới token: " + e.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request) {
        // Lấy cookie refresh_token từ request
        String refreshToken = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if ("refresh_token".equals(cookie.getName())) {
                    refreshToken = cookie.getValue();
                    break;
                }
            }
        }

        if (refreshToken != null) {
            // Gọi service để revoke token trong DB
            tokenService.revokeRefreshToken(refreshToken);
        }

        // Xóa cookie refresh_token phía client
        ResponseCookie deleteCookie = ResponseCookie.from("refresh_token", "")
                .httpOnly(true)
                .secure(true)
                .path("/")
                .maxAge(0) // hết hạn ngay
                .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, deleteCookie.toString())
                .body(Map.of("message", "Đăng xuất thành công"));
    }
}
