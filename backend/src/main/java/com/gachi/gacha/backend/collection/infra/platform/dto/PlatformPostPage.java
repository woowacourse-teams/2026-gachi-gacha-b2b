package com.gachi.gacha.backend.collection.infra.platform.dto;

import java.util.List;

public record PlatformPostPage(
        List<PlatformPostDto> posts,
        String nextCursor
) {
    public boolean hasNext() {
        return nextCursor != null;
    }
}
