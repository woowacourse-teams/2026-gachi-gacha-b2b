package com.gachi.gacha.backend.gacha.application.dto;

import com.gachi.gacha.backend.gacha.domain.Category;

public record CategoryInfo(
        Long categoryId,
        String name
) {

    public static CategoryInfo from(final Category category) {
        return new CategoryInfo(category.getId(), category.getName());
    }
}
