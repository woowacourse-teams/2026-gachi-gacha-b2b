package com.gachi.gacha.backend.gacha.presentation.dto;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.gacha.application.dto.GachaInfo;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record GachaResponse(
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
    public static GachaResponse from(final GachaInfo gachaInfo) {
        return GachaResponse.builder()
                .gachaId(gachaInfo.gachaId())
                .name(gachaInfo.name())
                .caption(gachaInfo.caption())
                .thumbnailUrl(gachaInfo.thumbnailUrl())
                .category(gachaInfo.category())
                .source(gachaInfo.source())
                .productCode(gachaInfo.productCode())
                .createdAt(gachaInfo.createdAt())
                .updatedAt(gachaInfo.updatedAt())
                .build();
    }
}
