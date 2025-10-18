package com.example.javi.dto.request;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import com.example.javi.entity.JlptLevel;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UpdateUserRequest {
    @Size(min = 4, message = "USERNAME_INVALID")
    @NotBlank(message = "USERNAME_CANNOT_BLANK")
    String username;

    LocalDate dateOfBirth;

    String fullName;

    JlptLevel jlptLevel;

    String selfIntroduction;

    Long roleId;
}
