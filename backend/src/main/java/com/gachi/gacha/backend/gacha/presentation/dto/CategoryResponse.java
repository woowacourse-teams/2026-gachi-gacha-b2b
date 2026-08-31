package com.gachi.gacha.backend.gacha.presentation.dto;

import com.gachi.gacha.backend.gacha.application.dto.CategoryInfo;

public record CategoryResponse(
        Long categoryId,
        String name
) {

    public static CategoryResponse from(final CategoryInfo category) {
        return new CategoryResponse(category.categoryId(), category.name());
    }
}
