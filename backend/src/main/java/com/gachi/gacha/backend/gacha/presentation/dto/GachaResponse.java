package com.gachi.gacha.backend.gacha.presentation.dto;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.gacha.application.dto.GachaInfo;
import java.time.LocalDateTime;
import java.util.List;
import lombok.Builder;

@Builder
public record GachaResponse(
        Long gachaId,
        String name,
        String caption,
        String thumbnailUrl,
        String productCode,
        List<String> categories,
        CollectionSource source,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static GachaResponse from(final GachaInfo gachaInfo) {
        return GachaResponse.builder()
                .gachaId(gachaInfo.gachaId())
                .name(gachaInfo.name())
                .caption(gachaInfo.caption())
                .thumbnailUrl(gachaInfo.thumbnailUrl())
                .productCode(gachaInfo.productCode())
                .categories(gachaInfo.categories())
                .source(gachaInfo.source())
                .createdAt(gachaInfo.createdAt())
                .updatedAt(gachaInfo.updatedAt())
                .build();
    }
}
