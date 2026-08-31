package com.gachi.gacha.backend.gacha.presentation.dto;

import com.gachi.gacha.backend.gacha.application.dto.GachaImageInfo;
import lombok.Builder;

@Builder
public record GachaImageResponse(
        Long gachaImageId,
        String imageUrl
) {
    public static GachaImageResponse from(final GachaImageInfo gachaImageInfo) {
        return GachaImageResponse.builder()
                .gachaImageId(gachaImageInfo.gachaImageId())
                .imageUrl(gachaImageInfo.imageUrl())
                .build();
    }
}
