package com.example.javi.controller;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import com.example.javi.dto.request.PermissionRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.entity.Permission;
import com.example.javi.service.PermissionService;
import com.turkraft.springfilter.boot.Filter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/permission")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class PermissionController {
    PermissionService permissionService;

    @PostMapping("")
    public ApiResponse<Permission> createPermission(@Valid @RequestBody PermissionRequest request) {
        Permission permission = permissionService.createPermission(request);
        return ApiResponse.<Permission>builder()
                .message("Tạo quyền thành công")
                .result(permission)
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<Permission> updatePermission(
            @PathVariable Long id, @Valid @RequestBody PermissionRequest request) {
        Permission permission = permissionService.updatePermission(id, request);
        return ApiResponse.<Permission>builder()
                .message("Cập nhật quyền thành công")
                .result(permission)
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deletePermission(@PathVariable Long id) {
        permissionService.deletePermission(id);
        return ApiResponse.<Void>builder().message("Xóa quyền thành công").build();
    }

    @GetMapping("/{id}")
    public ApiResponse<Permission> getPermission(@PathVariable Long id) {
        Permission permission = permissionService.getPermission(id);
        return ApiResponse.<Permission>builder()
                .message("Lấy thông tin quyền thành công")
                .result(permission)
                .build();
    }

    @GetMapping("/all")
    public ApiResponse<List<Permission>> getAllPermissions() {
        List<Permission> permissions = permissionService.getAllPermissions();
        return ApiResponse.<List<Permission>>builder()
                .message("Lấy toàn bộ quyền thành công")
                .result(permissions)
                .build();
    }

    @GetMapping("")
    public ApiResponse<?> getPermissionsByFilter(
            @Filter Specification<Permission> spec, @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        int page = pageable.getPageNumber();
        if (page <= 0) page = 1;
        Pageable oneIndexedPageable = PageRequest.of(page - 1, pageable.getPageSize(), pageable.getSort());

        Page<Permission> permissionPage = permissionService.getAllPermissionByFilter(spec, oneIndexedPageable);
        return ApiResponse.builder()
                .message("Lấy thông tin quyền thành công")
                .result(permissionPage)
                .build();
    }
}
