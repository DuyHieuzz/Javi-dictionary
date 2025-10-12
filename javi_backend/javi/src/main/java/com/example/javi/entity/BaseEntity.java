package com.example.javi.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;

import lombok.*;

@Data
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@MappedSuperclass
public class BaseEntity {
    @Column(name = "created_at")
    // @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private LocalDate createdAt;

    @Column(name = "updated_at")
    // @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", timezone = "UTC")
    private LocalDate updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = createdAt != null ? createdAt : LocalDate.now();
        updatedAt = LocalDate.now();
        if (this instanceof Users user) {
            if (user.getAccountType() == null) user.setAccountType(AccountType.FREE);
            if (user.getStatus() == null) user.setStatus(Status.ACTIVE);
            if (user.getRemainingTrialExplains() == 0) user.setRemainingTrialExplains(5);
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDate.now();
    }
}
