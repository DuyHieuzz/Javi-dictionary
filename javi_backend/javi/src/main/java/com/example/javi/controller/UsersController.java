package com.example.javi.controller;

import java.io.IOException;
import java.net.URISyntaxException;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.request.ChangePassRequest;
import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.request.UpdateUserRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.UserResponse;
import com.example.javi.entity.Users;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.service.FileService;
import com.example.javi.service.UsersService;
import com.example.javi.utils.ValidationUtils;
import com.turkraft.springfilter.boot.Filter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UsersController {
    @Value("${javi.upload-file.base-uri}")
    @NonFinal
    String baseURI;

    UsersService usersService;
    FileService fileService;

    @PostMapping("/register")
    public ApiResponse createUser(@Valid @RequestBody CreateUserRequest user) {

        if (!ValidationUtils.isValidEmail(user.getEmail())) {
            throw new AppException(ErrorCode.INVALID_EMAIL);
        }

        UserResponse userResponse = usersService.createUser(user);

        return ApiResponse.builder()
                .message("Đăng ký thành công")
                .result(userResponse)
                .build();
    }

    @GetMapping("/my-info")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(usersService.getMyInfo())
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest user) {
        UserResponse userResponse = usersService.updateUser(id, user);
        return ApiResponse.builder()
                .message("Cập nhật thành công")
                .result(userResponse)
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse getUserById(@PathVariable Long id) {
        UserResponse userResponse = usersService.getUserById(id);
        return ApiResponse.builder()
                .message("Lấy user thành công")
                .result(userResponse)
                .build();
    }

    @GetMapping("/")
    ApiResponse getAllUsersByFilter(
            @Filter Specification<Users> spec, @PageableDefault(size = 20, sort = "Id") Pageable pageable) {
        int page = pageable.getPageNumber();
        if (page > 0) {
            page = page - 1;
        }
        Pageable oneIndexedPageable = PageRequest.of(page, pageable.getPageSize(), pageable.getSort());
        return ApiResponse.builder()
                .message("Lấy danh sách người dùng thành công")
                .result(usersService.getAllUsersByFilter(spec, oneIndexedPageable))
                .build();
    }

    @PutMapping("/{id}/avatar")
    public ApiResponse updateAvatar(@PathVariable Long id, @RequestParam("file") MultipartFile file)
            throws IOException, URISyntaxException {
        String folder = "avatar"; // cố định folder

        // tạo thư mục nếu chưa có
        fileService.createDirectory(baseURI + folder);

        // lưu file và lấy tên
        String fileName = fileService.store(file, folder);

        // cập nhật avatar cho user
        return ApiResponse.builder()
                .message("Cập nhật avatar thành công")
                .result(usersService.updateAvatar(id, fileName))
                .build();
    }

    @PutMapping("/change-password/{id}")
    public ApiResponse changePassword(@PathVariable Long id, @Valid @RequestBody ChangePassRequest changePassRequest) {
        return ApiResponse.builder()
                .message("Đổi mật khẩu thành công")
                .result(usersService.changePassword(id, changePassRequest))
                .build();
    }

    @PutMapping("/block/{id}")
    public ApiResponse block(@PathVariable Long id) {
        usersService.blockUser(id);
        return ApiResponse.builder()
                .message("Khóa tài khoản người dùng thành công")
                .build();
    }

    @PutMapping("/unblock/{id}")
    public ApiResponse unblock(@PathVariable Long id) {
        usersService.unblockUser(id);
        return ApiResponse.builder()
                .message("Mở khóa tài khoản người dùng thành công")
                .build();
    }
}
