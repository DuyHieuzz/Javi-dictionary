package com.example.javi.controller;

import com.example.javi.dto.request.ChangePassRequest;
import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.service.FileService;
import com.example.javi.service.UsersService;
import jakarta.validation.Valid;
import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.experimental.NonFinal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URISyntaxException;

@RestController
@RequestMapping("${api.prefix}/users")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class UsersControllor {
    @Value("${javi.upload-file.base-uri}")
    @NonFinal
    String baseURI;

    UsersService usersService;
    FileService fileService;

//    @GetMapping("")
//    public ResponseEntity<ApiResponse> getAllUsers(@RequestParam(defaultValue = "0") int page,
//                                                   @RequestParam(defaultValue = "10") int limit) {
//        PageRequest pageRequest = PageRequest.of(page, limit, Sort.by("id").ascending());
//
//    }

    @PostMapping("")
    public ApiResponse createUser(@Valid @RequestBody CreateUserRequest user) {
        return ApiResponse.builder()
                .result(usersService.createUser(user))
                .build();
    }

    @PutMapping("/{id}/avatar")
    public ApiResponse updateAvatar(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) throws IOException, URISyntaxException {
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
    public ApiResponse changePassword(@PathVariable Long id,
                                      @Valid @RequestBody ChangePassRequest changePassRequest) {
        return ApiResponse.builder()
                .message("Đổi mật khẩu thành công")
                .result(usersService.changePassword(id, changePassRequest))
                .build();
    }

    @PutMapping("/block/{id}")
    public ApiResponse block(@PathVariable Long id) {
        usersService.blockUser(id);
        return ApiResponse.builder()
                .message("Khóa tài khoản user thành công")
                .build();
    }

    @PutMapping("/unblock/{id}")
    public ApiResponse unblock(@PathVariable Long id) {
        usersService.unblockUser(id);
        return ApiResponse.builder()
                .message("Mở khóa tài khoản user thành công")
                .build();
    }

    
}
