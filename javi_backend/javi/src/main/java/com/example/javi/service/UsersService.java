package com.example.javi.service;

import com.example.javi.dto.request.ChangePassRequest;
import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.response.CreateUserResponse;
import com.example.javi.entity.Users;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


public interface UsersService {
    Page<Users> getAllUsers(Pageable pageable);

    CreateUserResponse createUser(CreateUserRequest user);

    String updateAvatar(Long userId, String fileName);

    String changePassword(Long userId, ChangePassRequest changePassRequest);

    void blockUser(Long userId);

    void unblockUser(Long userId);
}
