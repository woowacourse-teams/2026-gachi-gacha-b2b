package com.gachi.gacha.backend.gacha.application.dto;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.gacha.domain.Category;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import java.util.List;
import lombok.Builder;

@Builder
public record GachaCreateCommand(
        String name,
        String caption,
        String thumbnailUrl,
        List<String> categories
) {
    public Gacha toEntity(final List<Category> resolvedCategories) {
        Gacha gacha = Gacha.builder()
                .name(this.name())
                .caption(this.caption())
                .thumbnailUrl(this.thumbnailUrl())
                .source(CollectionSource.MANUAL)
                .build();
        gacha.patch(null, null, null, resolvedCategories);
        return gacha;
    }
}
