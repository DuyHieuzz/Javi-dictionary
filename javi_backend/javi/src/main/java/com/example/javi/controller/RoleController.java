package com.example.javi.controller;

import jakarta.validation.Valid;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

import com.example.javi.dto.request.RoleRequest;
import com.example.javi.dto.response.ApiResponse;
import com.example.javi.entity.Role;
import com.example.javi.service.RoleService;
import com.turkraft.springfilter.boot.Filter;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("${api.prefix}/role")
@RequiredArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class RoleController {
    RoleService roleService;

    @PostMapping("")
    public ApiResponse<Role> createRole(@Valid @RequestBody RoleRequest request) {
        Role role = roleService.createRole(request);
        return ApiResponse.<Role>builder()
                .message("Tạo role thành công")
                .result(role)
                .build();
    }

    @PutMapping("/{id}")
    public ApiResponse<Role> updateRole(@PathVariable Long id, @Valid @RequestBody RoleRequest request) {
        Role role = roleService.updateRole(id, request);
        return ApiResponse.<Role>builder()
                .message("Cập nhật role thành công")
                .result(role)
                .build();
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteRole(@PathVariable Long id) {
        roleService.deleteRole(id);
        return ApiResponse.<Void>builder().message("Xóa role thành công").build();
    }

    @GetMapping("/{id}")
    public ApiResponse<Role> getRoleById(@PathVariable Long id) {
        Role role = roleService.getRoleById(id);
        return ApiResponse.<Role>builder()
                .message("Lấy thông tin role thành công")
                .result(role)
                .build();
    }

    @GetMapping("")
    public ApiResponse<?> getAllRoles(
            @Filter Specification<Role> spec, @PageableDefault(size = 20, sort = "Id") Pageable pageable) {
        int page = pageable.getPageNumber();
        if (page <= 0) page = 1;
        Pageable oneIndexedPageable = PageRequest.of(page - 1, pageable.getPageSize(), pageable.getSort());

        Page<Role> rolePage = roleService.getAllRolesByFilter(spec, oneIndexedPageable);
        return ApiResponse.builder()
                .message("Lấy thông tin role thành công")
                .result(rolePage)
                .build();
    }
}
