package com.example.javi.dto.request;

import com.example.javi.entity.Permission;
import jakarta.validation.constraints.NotBlank;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.util.List;

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
    List<Permission> permissions;
}
