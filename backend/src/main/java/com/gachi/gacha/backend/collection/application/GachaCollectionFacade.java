package com.gachi.gacha.backend.collection.application;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.domain.GachaCollector;
import java.time.Instant;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

@Component
public class GachaCollectionFacade {

    private static final Logger log = LoggerFactory.getLogger(GachaCollectionFacade.class);
    private static final List<CollectionSource> COLLECTION_ORDER = List.of(
            CollectionSource.BANDAI,
            CollectionSource.IP4,
            CollectionSource.A_MUZU
    );

    private final Map<CollectionSource, GachaCollector> collectors;
    private final GachaCollectionService collectionService;

    public GachaCollectionFacade(
            final List<GachaCollector> collectors,
            final GachaCollectionService collectionService
    ) {
        this.collectors = indexCollectors(collectors);
        this.collectionService = collectionService;
    }

    public List<CollectionResult> collectAll() {
        return COLLECTION_ORDER.stream()
                .map(this::collect)
                .toList();
    }

    public CollectionResult collect(final CollectionSource source) {
        final Instant startedAt = Instant.now();
        try {
            final GachaCollector collector = findCollector(source);
            final List<CollectedGacha> collectedGachas = collector.collect();
            final int insertedCount = collectionService.saveNewGachas(source, collectedGachas);
            return CollectionResult.success(source, collectedGachas.size(), insertedCount, startedAt);
        } catch (final RuntimeException exception) {
            log.error("가챠 수집에 실패했습니다. source={}", source, exception);
            return CollectionResult.failure(source, startedAt);
        }
    }

    private GachaCollector findCollector(final CollectionSource source) {
        final GachaCollector collector = collectors.get(source);
        if (collector == null) {
            throw new IllegalArgumentException("지원하지 않는 수집 출처입니다. source=" + source);
        }
        return collector;
    }

    private Map<CollectionSource, GachaCollector> indexCollectors(final List<GachaCollector> collectorList) {
        final Map<CollectionSource, GachaCollector> indexed = new EnumMap<>(CollectionSource.class);
        for (final GachaCollector collector : collectorList) {
            final GachaCollector previous = indexed.put(collector.source(), collector);
            if (previous != null) {
                throw new IllegalStateException("수집기가 중복 등록되었습니다. source=" + collector.source());
            }
        }
        return Map.copyOf(indexed);
    }
}
