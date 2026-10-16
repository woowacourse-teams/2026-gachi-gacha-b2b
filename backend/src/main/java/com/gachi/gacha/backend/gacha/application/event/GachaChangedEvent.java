package com.gachi.gacha.backend.gacha.application.event;

import java.util.List;
import lombok.Builder;

@Builder
public record GachaChangedEvent(
        List<Long> gachaIds
) {
    public static GachaChangedEvent change(List<Long> gachaIds) {
        return GachaChangedEvent.builder()
                .gachaIds(gachaIds)
                .build();
    }
}
