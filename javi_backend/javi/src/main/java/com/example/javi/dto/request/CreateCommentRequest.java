package com.example.javi.dto.request;

import com.example.javi.entity.EntityType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@FieldDefaults(level = AccessLevel.PRIVATE)
public class CreateCommentRequest {
    @NotNull(message = "COMMENT_HAS_NO_ENTITY_TYPE")
    EntityType entityType;

    @NotNull(message = "COMMENT_HAS_NO_ENTITY_ID")
    Long entityId;

    @NotBlank(message = "COMMENT_HAS_NO_CONTENT")
    String content;
}
