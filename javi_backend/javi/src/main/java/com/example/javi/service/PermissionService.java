package com.example.javi.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.example.javi.dto.request.PermissionRequest;
import com.example.javi.entity.Permission;

public interface PermissionService {
    Permission createPermission(PermissionRequest request);

    Permission updatePermission(Long id, PermissionRequest request);

    void deletePermission(Long id);

    Permission getPermission(Long id);

    List<Permission> getAllPermissions();

    Page<Permission> getAllPermissionByFilter(Specification<Permission> spec, Pageable pageable);
}
