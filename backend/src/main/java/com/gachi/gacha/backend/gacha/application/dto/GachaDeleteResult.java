package com.gachi.gacha.backend.gacha.application.dto;

import com.gachi.gacha.backend.gacha.domain.Gacha;
import lombok.Builder;

@Builder
public record GachaDeleteResult(
        Long gachaId
) {
    public static GachaDeleteResult from(final Gacha gacha) {
        return GachaDeleteResult.builder()
                .gachaId(gacha.getId())
                .build();
    }
}
