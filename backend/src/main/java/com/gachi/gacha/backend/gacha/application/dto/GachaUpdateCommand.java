package com.gachi.gacha.backend.gacha.application.dto;

import lombok.Builder;

@Builder
public record GachaUpdateCommand(
        String name,
        String caption,
        String thumbnailUrl,
        String category
) {
}
