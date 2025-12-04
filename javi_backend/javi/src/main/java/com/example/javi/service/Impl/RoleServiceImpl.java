package com.example.javi.service.Impl;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.javi.dto.request.RoleRequest;
import com.example.javi.entity.Permission;
import com.example.javi.entity.Role;
import com.example.javi.exeption.AppException;
import com.example.javi.exeption.ErrorCode;
import com.example.javi.mapper.RoleMapper;
import com.example.javi.repository.PermissionRepository;
import com.example.javi.repository.RoleRepository;
import com.example.javi.service.RoleService;

import lombok.AccessLevel;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;

@Service
@RequiredArgsConstructor
@Slf4j
@FieldDefaults(level = AccessLevel.PRIVATE, makeFinal = true)
public class RoleServiceImpl implements RoleService {
    RoleRepository roleRepository;
    PermissionRepository permissionRepository;
    RoleMapper roleMapper;

    @Override
    @Transactional
    public Role createRole(RoleRequest request) {
        if (roleRepository.findByName(request.getName()).isPresent()) {
            throw new AppException(ErrorCode.ROLE_NAME_ALREADY_EXISTING);
        }
        // check permissions
        if (request.getPermissions() != null) {
            List<Long> reqPermissions =
                    request.getPermissions().stream().map(Permission::getId).collect(Collectors.toList());

            List<Permission> dbPermissions = this.permissionRepository.findByIdIn(reqPermissions);
            request.setPermissions(dbPermissions);
        }
        Role role = roleMapper.toRole(request);

        return roleRepository.save(role);
    }

    @Override
    @Transactional
    public Role updateRole(Long id, RoleRequest request) {
        Role roleToUpdate = roleRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        // Không cho đổi tên hệ thống (cần xem xét có cho đổi tên hệ thống không)
        if (roleToUpdate.isSystemRole() && !roleToUpdate.getName().equals(request.getName())) {
            throw new AppException(ErrorCode.SYSTEM_ROLE_CANNOT_RENAME);
        }

        // Xử lý và ánh xạ Permissions (giống createRole)
        if (request.getPermissions() != null) {
            List<Long> reqPermissions = request.getPermissions().stream()
                    .map(Permission::getId) // Dùng method reference cho gọn
                    .collect(Collectors.toList());

            List<Permission> dbPermissions = this.permissionRepository.findByIdIn(reqPermissions);
            // Cập nhật Permissions vào DTO Request trước khi mapping
            request.setPermissions(dbPermissions);

            // --- BỔ SUNG: kiểm tra không cho gỡ quyền hệ thống khỏi vai trò ADMIN ---
            // Lấy id hiện có trên DB
            List<Long> existingPermIds = roleToUpdate.getPermissions() == null
                    ? List.of()
                    : roleToUpdate.getPermissions().stream()
                            .map(Permission::getId)
                            .collect(Collectors.toList());

            // Tập id mới từ request (sau khi đã load dbPermissions)
            List<Long> newPermIds =
                    dbPermissions.stream().map(Permission::getId).collect(Collectors.toList());

            // Tập id bị xóa = existing - new
            List<Long> removedIds = existingPermIds.stream()
                    .filter(idPerm -> !newPermIds.contains(idPerm))
                    .collect(Collectors.toList());

            if (!removedIds.isEmpty() && "ADMIN".equalsIgnoreCase(roleToUpdate.getName())) {
                // load removed permissions để kiểm tra flag systemPermission
                List<Permission> removedPerms = this.permissionRepository.findByIdIn(removedIds);
                boolean hasSystemRemoved = removedPerms.stream().anyMatch(Permission::isSystemPermission);
                if (hasSystemRemoved) {
                    throw new AppException(ErrorCode.ROLE_CANNOT_REMOVE_SYSTEM_PERMISSION_FROM_ADMIN);
                }
            }
        }

        // Cập nhật Entity từ Request DTO
        // Sử dụng phương thức updateRoleFromRoleRequest đã định nghĩa trong RoleMapper
        roleMapper.updateRoleFromRoleRequest(request, roleToUpdate);
        return roleRepository.save(roleToUpdate);
    }

    @Override
    @Transactional
    public void deleteRole(Long id) {
        Role role = roleRepository.findById(id).orElseThrow(() -> new AppException(ErrorCode.ROLE_NOT_FOUND));

        if (role.isSystemRole()) {
            throw new AppException(ErrorCode.SYSTEM_ROLE_CANNOT_DELETE);
        }

        // Bắt phải đổi hết người dùng có role cần xóa sang một role khác, role không có ai dùng mới cho xóa
        // Chắc là không nên đổi người dùng đang có role cần xóa sang role mặc định là user
        if (role.getUsers() != null && !role.getUsers().isEmpty()) {
            throw new AppException(ErrorCode.ROLE_IN_USE);
        }

        roleRepository.delete(role);
    }

    @Override
    public Role getRoleById(Long id) {
        Optional<Role> role = roleRepository.findById(id);
        if (role.isEmpty()) {
            throw new AppException(ErrorCode.ROLE_NOT_FOUND);
        }
        return role.get();
    }

    @Override
    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    @Override
    public Page<Role> getAllRolesByFilter(Specification<Role> spec, Pageable pageable) {
        return roleRepository.findAll(spec, pageable);
    }
}
