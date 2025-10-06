package com.example.javi.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.javi.entity.Permission;

public interface PermissionRepository extends JpaRepository<Permission, Long> {}
