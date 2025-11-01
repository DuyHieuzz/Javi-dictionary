package com.example.javi.dto.response;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class GoogleUserInfo {
    String sub; // Google ID
    String email;
    Boolean email_verified;
    String name;
    String picture;
}
