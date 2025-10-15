package com.example.javi.service;

import java.io.UnsupportedEncodingException;

import jakarta.mail.MessagingException;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.javi.dto.request.ChangePassRequest;
import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.request.LoginRequest;
import com.example.javi.dto.request.UpdateUserRequest;
import com.example.javi.dto.response.UserResponse;
import com.example.javi.entity.PremiumType;
import com.example.javi.entity.Users;

public interface UsersService {
    Page<Users> getAllUsersByFilter(Specification<Users> spec, Pageable pageable);

    UserResponse getUserById(Long id);

    UserResponse createUser(CreateUserRequest user) throws MessagingException, UnsupportedEncodingException;

    UserResponse getMyInfo();

    String updateAvatar(Long userId, String fileName);

    String changePassword(Long userId, ChangePassRequest changePassRequest);

    void blockUser(Long userId);

    void unblockUser(Long userId);

    String login(LoginRequest loginRequest);

    UserResponse updateUser(Long userId, UpdateUserRequest updateUserRequest);

    // Hàm thủ công, getMyInfo hiệu năng cao hơn
    Users getUserDetailsFromToken(String token);

    String setPremiumManually(Long userId, PremiumType premiumType);

    void checkAndUpdateImageQuota(Users users);
}
