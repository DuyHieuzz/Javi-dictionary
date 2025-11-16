package com.example.javi.dto.response;

import java.time.LocalDate;

import com.example.javi.entity.EntityType;
import com.example.javi.entity.ReactionType;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CommentResponse {
    Long id;
    Long userId;
    String userName;
    String avatarUrl;
    EntityType entityType;
    Long entityId;
    String entityName;
    String content;
    int likeCount;
    int dislikeCount;
    Boolean isMyComment; // đúng thì cho thêm thùng rác bên cạnh trên FE để xóa, cho phép cập nhật
    LocalDate createdAt;
    ReactionType myReaction;
}
