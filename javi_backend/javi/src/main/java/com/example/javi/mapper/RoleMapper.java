package com.example.javi.mapper;

import com.example.javi.dto.request.KanjiRequest;
import com.example.javi.dto.request.RoleRequest;
import com.example.javi.entity.Kanji;
import com.example.javi.entity.Role;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "Spring")
public interface RoleMapper {
    Role toRole(RoleRequest roleRequest);
    @Mapping(target = "id", ignore = true) // id không bị ghi đè
    void updateRoleFromRoleRequest(RoleRequest request, @MappingTarget Role role);
}
