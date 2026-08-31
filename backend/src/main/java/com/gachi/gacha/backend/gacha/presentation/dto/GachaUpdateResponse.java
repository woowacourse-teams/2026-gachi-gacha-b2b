package com.gachi.gacha.backend.gacha.presentation.dto;

import com.gachi.gacha.backend.gacha.application.dto.GachaResult;
import java.time.LocalDateTime;
import lombok.Builder;

@Builder
public record GachaUpdateResponse(
        Long gachaId,
        LocalDateTime updatedAt
) {
    public static GachaUpdateResponse from(final GachaResult gachaResult) {
        return GachaUpdateResponse.builder()
                .gachaId(gachaResult.gachaId())
                .updatedAt(gachaResult.updatedAt())
                .build();
    }
}
