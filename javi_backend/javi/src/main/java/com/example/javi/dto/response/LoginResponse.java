package com.example.javi.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class LoginResponse {
    String token;

    @JsonProperty("refresh_token")
    String refreshToken;

    String tokenType = "Bearer";

    UserResponse user;
}
