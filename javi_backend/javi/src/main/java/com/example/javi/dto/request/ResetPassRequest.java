package com.example.javi.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class ResetPassRequest {
    @NotBlank(message = "TOKEN_CANNOT_EMPTY")
    String token;

    @Size(min = 6, message = "INVALID_PASSWORD")
    @NotBlank(message = "PASSWORD_CANNOT_BLANK")
    String newPassword;

    @NotBlank(message = "PASSWORD_CANNOT_BLANK")
    String confirmPassword;
}
