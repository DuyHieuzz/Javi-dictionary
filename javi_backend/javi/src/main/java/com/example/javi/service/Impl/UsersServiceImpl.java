package com.example.javi.service.Impl;

import com.example.javi.dto.request.ChangePassRequest;
import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.response.CreateUserResponse;
import com.example.javi.entity.Status;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.UsersMapper;
import com.example.javi.repository.UsersRepository;
import com.example.javi.service.UsersService;
import com.example.javi.utils.ValidationUtils;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class UsersServiceImpl implements UsersService {
    UsersRepository usersRepository;
//    ValidationUtils validationUtils;
    UsersMapper usersMapper;

    @Override
    public Page<Users> getAllUsers(Pageable pageable) {
        return usersRepository.findAll(pageable);
    }

    @Override
    public CreateUserResponse createUser(CreateUserRequest user) {
        boolean isValidEmail = ValidationUtils.isValidEmail(user.getEmail());
        boolean existEmail = usersRepository.existsByEmail(user.getEmail());
        boolean existUsername = usersRepository.existsByUsername(user.getUsername());
        if (!isValidEmail) {
            throw new AppException(ErrorCode.INVALID_EMAIL);
        }
        if (existEmail) {
            throw new AppException(ErrorCode.EXIST_EMAIL);
        }
        if (existUsername) {
            throw new AppException(ErrorCode.EXIST_USERNAME);
        }
        if (!user.getPassword().equals(user.getConfirmPassword())) {
            throw new AppException(ErrorCode.MISMATCH_PASSWORD);
        }
        Users users = new Users();
        users = usersMapper.toUsers(user);
        usersRepository.save(users);
        return usersMapper.toCreateUserResponse(users);
    }

    @Override
    public String updateAvatar(Long userId, String fileName) {
        Users user = usersRepository.findById(userId)
                .orElseThrow(() -> new AppException(ErrorCode.USER_NOT_FOUND));
        user.setAvatarUrl(fileName);
        usersRepository.save(user);
        return fileName;
    }

    @Override
    public String changePassword(Long userId, ChangePassRequest changePassRequest) {
        Optional<Users> users = usersRepository.findById(userId);
        if (users.isEmpty()) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        Users user = users.get();
        if (!user.getPassword().equals(changePassRequest.getOldPassword())) {
            throw new AppException(ErrorCode.INCORRECT_PASSWORD);
        }
        if (!changePassRequest.getNewPassword().equals(changePassRequest.getConfirmPassword())) {
            throw new AppException(ErrorCode.MISMATCH_PASSWORD);
        }
        user.setPassword(changePassRequest.getNewPassword());
        usersRepository.save(user);
        return "Thành công";
    }

    @Override
    public void blockUser(Long userId) {
        Optional<Users> users = usersRepository.findById(userId);
        if (users.isEmpty()) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        Users user = users.get();
        user.setStatus(Status.BLOCKED);
        usersRepository.save(user);
    }

    @Override
    public void unblockUser(Long userId) {
        Optional<Users> users = usersRepository.findById(userId);
        if (users.isEmpty()) {
            throw new AppException(ErrorCode.USER_NOT_FOUND);
        }
        Users user = users.get();
        user.setStatus(Status.ACTIVE);
        usersRepository.save(user);
    }
}
