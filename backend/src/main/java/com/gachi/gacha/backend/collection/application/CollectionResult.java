package com.gachi.gacha.backend.collection.application;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import java.time.Instant;

public record CollectionResult(
        CollectionSource source,
        int discoveredCount,
        int insertedCount,
        int skippedCount,
        int failedCount,
        Instant startedAt,
        Instant finishedAt
) {

    public static CollectionResult success(
            final CollectionSource source,
            final int discoveredCount,
            final int insertedCount,
            final Instant startedAt
    ) {
        return new CollectionResult(
                source,
                discoveredCount,
                insertedCount,
                discoveredCount - insertedCount,
                0,
                startedAt,
                Instant.now()
        );
    }

    public static CollectionResult failure(final CollectionSource source, final Instant startedAt) {
        return new CollectionResult(source, 0, 0, 0, 1, startedAt, Instant.now());
    }

    public boolean succeeded() {
        return failedCount == 0;
    }
}
