package com.example.javi.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.example.javi.entity.JlptLevel;
import com.example.javi.entity.RoleName;
import com.example.javi.entity.Status;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateUserRequest {
    String fullName;

    @Size(min = 4, message = "USERNAME_INVALID")
    @NotBlank(message = "USERNAME_CANNOT_BLANK")
    String username;

    @NotBlank(message = "EMAIL_CANNOT_BLANK")
    String email;

    @Size(min = 6, message = "INVALID_PASSWORD")
    @NotBlank(message = "PASSWORD_CANNOT_BLANK")
    String password;

    String confirmPassword;

    LocalDate dateOfBirth;

    JlptLevel level = JlptLevel.N5;

    String avatarUrl;

    RoleName roleName = RoleName.USER;

    Status status = Status.ACTIVE;
}
