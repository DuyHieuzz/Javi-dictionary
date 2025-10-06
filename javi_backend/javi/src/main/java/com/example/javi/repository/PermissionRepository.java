package com.example.javi.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.javi.entity.Permission;

import java.util.List;

public interface PermissionRepository extends JpaRepository<Permission, Long> {
    List<Permission> findByIdIn(List<Long> id);
}
