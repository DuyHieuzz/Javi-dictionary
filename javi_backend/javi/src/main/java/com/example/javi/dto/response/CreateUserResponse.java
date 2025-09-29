package com.example.javi.dto.response;

import com.example.javi.entity.Role;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateUserResponse {
    long id;
    String username;
    String email;
    String password;
    Role role;
}
