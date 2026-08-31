package com.gachi.gacha.backend.collection.infra.platform.dto;

import com.gachi.gacha.backend.collection.infra.platform.PlatformType;

public record PlatformPostDto(
        String originalId,
        String content,
        String imageUrl,
        PlatformType platformType
) {
}
