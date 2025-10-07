package com.example.javi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

import com.example.javi.dto.request.PermissionRequest;
import com.example.javi.entity.Permission;

@Mapper(componentModel = "spring")
public interface PermissionMapper {
    Permission toPermission(PermissionRequest request);

    @Mapping(target = "id", ignore = true)
    void updatePermission(PermissionRequest request, @MappingTarget Permission permission);
}
