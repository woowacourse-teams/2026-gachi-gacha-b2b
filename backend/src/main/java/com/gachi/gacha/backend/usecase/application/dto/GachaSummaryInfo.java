package com.gachi.gacha.backend.usecase.application.dto;

import com.gachi.gacha.backend.gacha.domain.Gacha;
import lombok.Builder;

@Builder
public record GachaSummaryInfo(
        Long gachaId,
        String thumbnailUrl
) {
    public static GachaSummaryInfo from(final Gacha gacha) {
        return GachaSummaryInfo.builder()
                .gachaId(gacha.getId())
                .thumbnailUrl(gacha.getThumbnailUrl())
                .build();
    }
}
