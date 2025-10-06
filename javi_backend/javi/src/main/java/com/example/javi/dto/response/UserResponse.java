package com.example.javi.dto.response;

import java.time.LocalDate;

import com.example.javi.entity.JlptLevel;
import com.example.javi.entity.Role;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class UserResponse {
    long id;
    String fullName;
    String username;
    String email;
    LocalDate dateOfBirth;
    JlptLevel level;
    Role roleName;
}
