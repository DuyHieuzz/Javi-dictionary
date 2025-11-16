package com.example.javi.mapper;

import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import com.example.javi.dto.response.CommentResponse;
import com.example.javi.entity.Comment;

@Mapper(componentModel = "spring")
public interface CommentMapper {
    @Mapping(source = "user.id", target = "userId")
    @Mapping(source = "user.username", target = "userName")
    @Mapping(source = "user.avatarUrl", target = "avatarUrl")
    @Mapping(target = "entityName", source = "entityName")
    @Mapping(target = "isMyComment", ignore = true)
    CommentResponse toCommentResponse(Comment comment);
}
