package com.example.javi.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

import com.example.javi.entity.AccountType;
import com.example.javi.entity.JlptLevel;
import com.example.javi.entity.Role;
import com.example.javi.entity.Status;

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
    String selfIntroduction;
    String avatarUrl;
    Role role;
    AccountType accountType;
    LocalDateTime premiumExpiredAt;
    Status status;
}
