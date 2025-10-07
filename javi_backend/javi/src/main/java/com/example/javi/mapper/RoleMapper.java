package com.example.javi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.example.javi.dto.request.RoleRequest;
import com.example.javi.entity.Role;

@Mapper(componentModel = "Spring")
public interface RoleMapper {
    Role toRole(RoleRequest roleRequest);

    @Mapping(target = "id", ignore = true) // id không bị ghi đè
    void updateRoleFromRoleRequest(RoleRequest request, @MappingTarget Role role);
}
