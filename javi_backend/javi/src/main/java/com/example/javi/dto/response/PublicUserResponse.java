package com.example.javi.dto.response;

import java.time.LocalDate;

import com.example.javi.entity.JlptLevel;
import com.example.javi.entity.PremiumType;
import com.example.javi.entity.Status;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class PublicUserResponse {
    Long id;
    String username;
    String fullName;
    JlptLevel level;
    String selfIntroduction;
    Status status;
    String avatarUrl;
    PremiumType premiumType;
    LocalDate dateOfBirth;
    LocalDate createdAt;
}
