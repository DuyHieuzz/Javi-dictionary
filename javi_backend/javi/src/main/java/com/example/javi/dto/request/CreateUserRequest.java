package com.example.javi.dto.request;

import com.example.javi.entity.Role;
import com.example.javi.entity.Status;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateUserRequest {
    @Size(min = 4, message = "USERNAME_INVALID")
    @NotBlank(message = "USERNAME_CANNOT_BLANK")
    String username;

    @NotBlank(message = "EMAIL_CANNOT_BLANK")
    String email;

    @Size(min = 6, message = "INVALID_PASSWORD")
    @NotBlank(message = "PASSWORD_CANNOT_BLANK")

    String password;

    String confirmPassword;

    String avatarUrl;

    Role role = Role.ROLE_USER;

    Status status = Status.ACTIVE;
}
//@Column(nullable = false, unique = true)
//String username;
//
//@Column(nullable = false, unique = true)
//String email;
//
//@Column(nullable = false)
//String password;
//
//@Column(name = "avatar_url")
//String avatarUrl;
//
//@Enumerated(EnumType.STRING)
//@Column(nullable = false)
//Role role;
//
//@Enumerated(EnumType.STRING)
//UserStatus status;
