package com.gachi.gacha.backend.gacha.domain;

import com.gachi.gacha.backend.common.exception.BusinessException;
import com.gachi.gacha.backend.common.exception.ErrorCode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false, length = 100)
    private String name;

    public Category(final String name) {
        this.name = normalize(name);
    }

    public void rename(final String name) {
        this.name = normalize(name);
    }

    private String normalize(final String name) {
        if (name == null || name.isBlank() || name.trim().length() > 100) {
            throw new BusinessException(ErrorCode.INVALID_CATEGORY_POLICY);
        }
        return name.trim();
    }
}
