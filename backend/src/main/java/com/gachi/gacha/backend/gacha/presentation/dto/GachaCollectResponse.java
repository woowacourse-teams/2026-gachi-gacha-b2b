package com.gachi.gacha.backend.gacha.presentation.dto;

import lombok.Builder;

@Builder
public record GachaCollectResponse(
        int collectedCount
) {
    public static GachaCollectResponse from(final int collectedCount) {
        return GachaCollectResponse.builder()
                .collectedCount(collectedCount)
                .build();
    }
}
