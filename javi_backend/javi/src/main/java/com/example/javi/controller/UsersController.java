package com.example.javi.controller;

import java.io.IOException;
import java.net.URISyntaxException;

import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import com.example.javi.dto.request.ChangePassRequest;
import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.request.UpdateUserRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.dto.response.UserResponse;
import com.example.javi.entity.PremiumType;
import com.example.javi.entity.Users;
import com.example.javi.service.FileService;
import com.example.javi.service.UsersService;
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

    @PostMapping
    @PreAuthorize("hasAuthority('CREATE_USER')")
    public ApiResponse<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.<UserResponse>builder()
                .message("Tạo người dùng thành công")
                .result(usersService.createUser(request))
                .build();
    }

    @GetMapping("/my-info")
    @PreAuthorize("isAuthenticated()")
    ApiResponse<UserResponse> getMyInfo() {
        return ApiResponse.<UserResponse>builder()
                .result(usersService.getMyInfo())
                .build();
    }

    @PutMapping("/{id}")
    @PreAuthorize("#id == authentication.principal.claims['userId'] or hasAuthority('MANAGE_USER')")
    public ApiResponse<UserResponse> updateUser(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest user) {
        UserResponse userResponse = usersService.updateUser(id, user);
        return ApiResponse.<UserResponse>builder()
                .message("Cập nhật thành công")
                .result(userResponse)
                .build();
    }

    @GetMapping("/{id}")
    ApiResponse<UserResponse> getUserById(@PathVariable Long id) {
        UserResponse userResponse = usersService.getUserById(id);
        return ApiResponse.<UserResponse>builder()
                .message("Lấy user thành công")
                .result(userResponse)
                .build();
    }

    @GetMapping("")
    ApiResponse<Page<UserResponse>> getAllUsersByFilter(
            @Filter Specification<Users> spec, @PageableDefault(size = 20, sort = "Id") Pageable pageable) {
        int page = pageable.getPageNumber();
        if (page <= 0) page = 1;
        Pageable oneIndexedPageable = PageRequest.of(page - 1, pageable.getPageSize(), pageable.getSort());

        return ApiResponse.<Page<UserResponse>>builder()
                .message("Lấy danh sách người dùng thành công")
                .result(usersService.getAllUsersByFilter(spec, oneIndexedPageable))
                .build();
    }

    @PutMapping("/{id}/avatar")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<String> updateAvatar(@PathVariable Long id, @RequestParam("file") MultipartFile file)
            throws IOException, URISyntaxException {
        String folder = "avatar"; // cố định folder

        // tạo thư mục nếu chưa có
        fileService.createDirectory(baseURI + folder);

        // lưu file và lấy tên
        String fileName = fileService.store(file, folder);

        // cập nhật avatar cho user
        return ApiResponse.<String>builder()
                .message("Cập nhật avatar thành công")
                .result(usersService.updateAvatar(id, fileName))
                .build();
    }

    @PutMapping("/change-password/{id}")
    @PreAuthorize("isAuthenticated()")
    public ApiResponse<UserResponse> changePassword(
            @PathVariable Long id, @Valid @RequestBody ChangePassRequest changePassRequest) {
        return ApiResponse.<UserResponse>builder()
                .message("Đổi mật khẩu thành công")
                .result(usersService.changePassword(id, changePassRequest))
                .build();
    }

    @PutMapping("/block/{id}")
    @PreAuthorize("hasAuthority('MANAGE_USER')")
    public ApiResponse<Void> block(@PathVariable Long id) {
        usersService.blockUser(id);
        return ApiResponse.<Void>builder()
                .message("Khóa tài khoản người dùng thành công")
                .build();
    }

    @PutMapping("/unblock/{id}")
    @PreAuthorize("hasAuthority('MANAGE_USER')")
    public ApiResponse<Void> unblock(@PathVariable Long id) {
        usersService.unblockUser(id);
        return ApiResponse.<Void>builder()
                .message("Mở khóa tài khoản người dùng thành công")
                .build();
    }

    @PreAuthorize("hasAuthority('MANAGE_USER')")
    @PutMapping("/{id}/upgrade-premium")
    public ApiResponse<UserResponse> upgrade(@PathVariable Long id, @RequestParam PremiumType type) {
        UserResponse userResponse = usersService.setPremiumManually(id, type);
        return ApiResponse.<UserResponse>builder()
                .message("Thành công")
                .result(userResponse)
                .build();
    }
}
