package com.example.javi.service.Impl;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;

import com.example.javi.dto.request.PermissionRequest;
import com.example.javi.entity.Permission;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.PermissionMapper;
import com.example.javi.repository.PermissionRepository;
import com.example.javi.service.PermissionService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class PermissionServiceImpl implements PermissionService {
    PermissionRepository permissionRepository;
    PermissionMapper permissionMapper;

    @Override
    public Permission createPermission(PermissionRequest request) {
        if (permissionRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.PERMISSION_NAME_ALREADY_EXISTING);
        }
        Permission permission = permissionMapper.toPermission(request);
        return permissionRepository.save(permission);
    }

    @Override
    public Permission updatePermission(Long id, PermissionRequest request) {
        Permission permission =
                permissionRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_FOUND));
        if (!permission.getName().equals(request.getName())
                && permissionRepository.existsByName(request.getName())) {
            throw new AppException(ErrorCode.PERMISSION_NAME_ALREADY_EXISTING);
        }

        permissionMapper.updatePermission(request, permission);
        return permissionRepository.save(permission);
    }

    @Override
    public void deletePermission(Long id) {
        Permission permission =
                permissionRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_FOUND));
        permissionRepository.delete(permission);
    }

    @Override
    public Permission getPermission(Long id) {
        return permissionRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.PERMISSION_NOT_FOUND));
    }

    @Override
    public Page<Permission> getAllPermissionByFilter(Specification<Permission> spec, Pageable pageable) {
        return permissionRepository.findAll(spec, pageable);
    }
}
