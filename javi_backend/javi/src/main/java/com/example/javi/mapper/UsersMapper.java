package com.example.javi.mapper;

import org.mapstruct.*;

import com.example.javi.dto.request.CreateUserRequest;
import com.example.javi.dto.request.UpdateUserRequest;
import com.example.javi.dto.response.PublicUserResponse;
import com.example.javi.dto.response.UserResponse;
import com.example.javi.entity.Users;

@Mapper(componentModel = "spring")
public interface UsersMapper {
    @Mapping(target = "role", ignore = true)
    Users toUsers(CreateUserRequest users);

    @Mapping(target = "accountType", source = "accountType")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "premiumExpiredAt", source = "premiumExpiredAt")
    UserResponse toCreateUserResponse(Users users);

    PublicUserResponse toPublicUserResponse(Users users);

    // Cập nhật (chỉ map các trường không null)
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateUserFromDto(UpdateUserRequest dto, @MappingTarget Users entity);

    @Mapping(target = "accountType", source = "accountType")
    @Mapping(target = "status", source = "status")
    @Mapping(target = "premiumExpiredAt", source = "premiumExpiredAt")
    @Mapping(target = "verified", source = "verified")
    UserResponse toUserResponse(Users users);

    // Xử lý hậu mapping
    @AfterMapping
    default void trimAndNullifyStrings(@MappingTarget Users user) {
        if (user.getFullName() != null) {
            String trimmed = user.getFullName().trim();
            user.setFullName(trimmed.isEmpty() ? null : trimmed);
        }

        if (user.getSelfIntroduction() != null) {
            String trimmed = user.getSelfIntroduction().trim();
            user.setSelfIntroduction(trimmed.isEmpty() ? null : trimmed);
        }

        if (user.getUsername() != null) {
            user.setUsername(user.getUsername().trim());
        }

        if (user.getAccountType() == null) {
            user.setAccountType(com.example.javi.entity.AccountType.FREE);
        }
        if (user.getStatus() == null) {
            user.setStatus(com.example.javi.entity.Status.ACTIVE);
        }
        if (user.getRemainingTrialExplains() == 0) {
            user.setRemainingTrialExplains(5);
        }

        if (user.getDailyImageTranslations() == 0) {
            user.setDailyImageTranslations(2);
        }
    }
}
