package com.example.javi.service;

import com.example.javi.dto.request.ChangePassRequest;
import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.CreateUserResponse;
import com.example.javi.entity.Users;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.net.URISyntaxException;

@Service
public interface UsersService {
    public Page<Users> getAllUsers(Pageable pageable);
    CreateUserResponse createUser(CreateUserRequest user);
    String updateAvatar(Long userId, String fileName);
    String changePassword(Long userId, ChangePassRequest changePassRequest);
    void blockUser(Long userId);
    void unblockUser(Long userId);
}
