package com.gachi.gacha.backend.collection.presentation;

import com.gachi.gacha.backend.collection.application.CollectionResult;
import com.gachi.gacha.backend.collection.application.GachaCollectionFacade;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        prefix = "collection.manual",
        name = "enabled",
        havingValue = "true"
)
public class ManualGachaCollectionRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(ManualGachaCollectionRunner.class);

    private final GachaCollectionFacade collectionFacade;
    private final String sourceName;

    public ManualGachaCollectionRunner(
            final GachaCollectionFacade collectionFacade,
            @Value("${collection.manual.source:BANDAI}") final String sourceName
    ) {
        this.collectionFacade = collectionFacade;
        this.sourceName = sourceName;
    }

    @Override
    public void run(final ApplicationArguments args) {
        List<CollectionResult> results = collect();
        results.forEach(this::logResult);

        if (results.stream().anyMatch(result -> !result.succeeded())) {
            throw new IllegalStateException("일부 가챠 수집에 실패했습니다. 로그를 확인해 주세요.");
        }
    }

    private List<CollectionResult> collect() {
        if ("ALL".equalsIgnoreCase(sourceName)) {
            return collectionFacade.collectAll();
        }

        CollectionSource source = parseSource(sourceName);
        if (!source.isCollectable()) {
            throw new IllegalArgumentException("수동 수집을 지원하지 않는 출처입니다. source=" + sourceName);
        }
        return List.of(collectionFacade.collect(source));
    }

    private CollectionSource parseSource(final String value) {
        try {
            return CollectionSource.valueOf(
                    value.trim().toUpperCase(Locale.ROOT).replace('-', '_')
            );
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException(
                    "지원하는 수동 수집 출처는 BANDAI, IP4, A_MUZU, ALL입니다. source=" + value,
                    exception
            );
        }
    }

    private void logResult(final CollectionResult result) {
        log.info(
                "수동 가챠 수집 결과. source={}, succeeded={}, discovered={}, inserted={}, skipped={}, failed={}",
                result.source(),
                result.succeeded(),
                result.discoveredCount(),
                result.insertedCount(),
                result.skippedCount(),
                result.failedCount()
        );
    }
}
