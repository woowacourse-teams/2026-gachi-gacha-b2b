package com.gachi.gacha.backend.gacha.application.dto;

import java.util.List;
import lombok.Builder;

@Builder
public record GachaUpdateCommand(
        String name,
        String caption,
        String thumbnailUrl,
        List<Long> categories
) {
}
