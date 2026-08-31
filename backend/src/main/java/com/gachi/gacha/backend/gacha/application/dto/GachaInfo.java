package com.gachi.gacha.backend.gacha.application.dto;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record GachaInfo(
        Long gachaId,
        String name,
        String caption,
        String thumbnailUrl,
        String category,
        CollectionSource source,
        String productCode,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static GachaInfo from(final Gacha gacha) {
        return GachaInfo.builder()
                .gachaId(gacha.getId())
                .name(gacha.getName())
                .caption(gacha.getCaption())
                .thumbnailUrl(gacha.getThumbnailUrl())
                .category(gacha.getCategory())
                .source(gacha.getSource())
                .productCode(gacha.getProductCode())
                .createdAt(gacha.getCreatedAt())
                .updatedAt(gacha.getUpdatedAt())
                .build();
    }
}
