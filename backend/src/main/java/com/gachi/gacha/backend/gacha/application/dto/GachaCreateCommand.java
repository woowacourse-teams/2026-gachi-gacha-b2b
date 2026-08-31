package com.gachi.gacha.backend.gacha.application.dto;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import lombok.Builder;

@Builder
public record GachaCreateCommand(
        String name,
        String caption,
        String thumbnailUrl,
        String category
) {
    public Gacha toEntity() {
        return Gacha.builder()
                .name(this.name())
                .caption(this.caption())
                .thumbnailUrl(this.thumbnailUrl())
                .category(this.category())
                .source(CollectionSource.MANUAL)
                .build();
    }
}
