package com.example.javi.dto.response;

import com.example.javi.entity.EntityType;
import lombok.*;
import lombok.experimental.FieldDefaults;

import java.time.LocalDate;
import java.time.LocalDateTime;

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
    String content;
    int likeCount;
    int dislikeCount;
    private Boolean isMyComment; //đúng thì cho thêm thùng rác bên cạnh trên FE để xóa
    LocalDate createdAt;
}
