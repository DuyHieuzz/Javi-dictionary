package com.example.javi.dto.request;

import java.util.List;

import jakarta.validation.constraints.NotBlank;

import com.example.javi.entity.Permission;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class RoleRequest {
    @NotBlank(message = "ROLE_HAS_NO_NAME")
    String name;

    String description;

    boolean isSystemRole = false;
    List<Permission> permissions;
}
