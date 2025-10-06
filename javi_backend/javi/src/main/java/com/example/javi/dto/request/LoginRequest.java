package com.example.javi.dto.request;

import jakarta.validation.constraints.NotBlank;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginRequest {
    @NotBlank(message = "EMAIL_CANNOT_BLANK")
    String email;

    @NotBlank(message = "PASSWORD_CANNOT_BLANK")
    String password;
}
