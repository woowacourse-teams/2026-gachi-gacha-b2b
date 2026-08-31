package com.gachi.gacha.backend.collection.application;

import static com.gachi.gacha.backend.common.exception.ErrorCode.INVALID_COLLECTION_CONFIGURATION;
import static com.gachi.gacha.backend.common.exception.ErrorCode.INVALID_COLLECTION_SOURCE;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.domain.GachaCollector;
import com.gachi.gacha.backend.collection.domain.GachaCollectionException;
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
        Instant startedAt = Instant.now();
        try {
            GachaCollector collector = findCollector(source);
            List<CollectedGacha> collectedGachas = collector.collect();
            int insertedCount = collectionService.saveNewGachas(source, collectedGachas);
            return CollectionResult.success(source, collectedGachas.size(), insertedCount, startedAt);
        } catch (RuntimeException exception) {
            log.error("가챠 수집에 실패했습니다. source={}", source, exception);
            return CollectionResult.failure(source, startedAt);
        }
    }

    private GachaCollector findCollector(final CollectionSource source) {
        GachaCollector collector = collectors.get(source);
        if (collector == null) {
            throw new GachaCollectionException(
                    INVALID_COLLECTION_SOURCE,
                    "지원하지 않는 수집 출처입니다. source=" + source
            );
        }
        return collector;
    }

    private Map<CollectionSource, GachaCollector> indexCollectors(final List<GachaCollector> collectorList) {
        Map<CollectionSource, GachaCollector> indexed = new EnumMap<>(CollectionSource.class);
        for (GachaCollector collector : collectorList) {
            GachaCollector previous = indexed.put(collector.source(), collector);
            if (previous != null) {
                throw new GachaCollectionException(
                        INVALID_COLLECTION_CONFIGURATION,
                        "수집기가 중복 등록되었습니다. source=" + collector.source()
                );
            }
        }
        return Map.copyOf(indexed);
    }
}
