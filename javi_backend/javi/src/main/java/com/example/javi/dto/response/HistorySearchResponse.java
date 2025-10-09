package com.example.javi.dto.response;

import java.time.LocalDate;

import com.example.javi.entity.EntityType;

import lombok.*;
import lombok.experimental.FieldDefaults;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
public class HistorySearchResponse {
    Long id;
    Long userId;
    Long entityId;
    EntityType entityType;
    String keyword;
    LocalDate searchedAt;
}
