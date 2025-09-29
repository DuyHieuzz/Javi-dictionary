package com.example.javi.mapper;

import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.response.CreateUserResponse;
import com.example.javi.entity.Users;
import org.mapstruct.Mapper;

@Mapper(componentModel = "spring")
public interface UsersMapper {
    Users toUsers(CreateUserRequest users);
    CreateUserResponse toCreateUserResponse(Users users);
}
