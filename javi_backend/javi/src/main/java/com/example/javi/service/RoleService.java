package com.example.javi.service;

import com.example.javi.dto.request.RoleRequest;
import com.example.javi.entity.Role;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

public interface RoleService {
    Role createRole (RoleRequest request);
    Role updateRole (Long id, RoleRequest request);
    void deleteRole (Long id);
    Role getRoleById(Long id);
    Page<Role> getAllRolesByFilter(Specification<Role> spec, Pageable pageable);
}
