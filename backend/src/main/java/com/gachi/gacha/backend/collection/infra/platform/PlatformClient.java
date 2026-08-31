package com.gachi.gacha.backend.collection.infra.platform;

import com.gachi.gacha.backend.collection.infra.platform.dto.PlatformPostDto;
import java.util.List;
import java.util.function.Predicate;

public interface PlatformClient {

    List<PlatformPostDto> fetchRecentPosts(
            String targetId,
            Predicate<List<PlatformPostDto>> shouldStopAfterPage
    );

    PlatformType getPlatformType();
}
