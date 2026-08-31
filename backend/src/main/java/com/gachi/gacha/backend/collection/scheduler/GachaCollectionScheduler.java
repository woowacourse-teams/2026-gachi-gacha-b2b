package com.gachi.gacha.backend.collection.scheduler;

import com.gachi.gacha.backend.collection.application.CollectionResult;
import com.gachi.gacha.backend.collection.application.GachaCollectionFacade;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(
        prefix = "collection.scheduling",
        name = "enabled",
        havingValue = "true"
)
public class GachaCollectionScheduler {

    private static final Logger log = LoggerFactory.getLogger(GachaCollectionScheduler.class);

    private final GachaCollectionFacade collectionFacade;
    private final AtomicBoolean running = new AtomicBoolean(false);

    public GachaCollectionScheduler(final GachaCollectionFacade collectionFacade) {
        this.collectionFacade = collectionFacade;
    }

    @Scheduled(
            cron = "${collection.scheduling.cron:0 0 4 * * *}",
            zone = "${collection.scheduling.zone:Asia/Seoul}"
    )
    public void collectGachas() {
        if (!running.compareAndSet(false, true)) {
            log.warn("이전 가챠 수집 작업이 실행 중이므로 이번 실행을 건너뜁니다.");
            return;
        }

        try {
            List<CollectionResult> results = collectionFacade.collectAll();
            results.forEach(this::logResult);
        } finally {
            running.set(false);
        }
    }

    private void logResult(final CollectionResult result) {
        if (result.succeeded()) {
            log.info(
                    "가챠 수집 완료. source={}, discovered={}, inserted={}, skipped={}, startedAt={}, finishedAt={}",
                    result.source(),
                    result.discoveredCount(),
                    result.insertedCount(),
                    result.skippedCount(),
                    result.startedAt(),
                    result.finishedAt()
            );
            return;
        }

        log.error(
                "가챠 수집 실패. source={}, failed={}, startedAt={}, finishedAt={}",
                result.source(),
                result.failedCount(),
                result.startedAt(),
                result.finishedAt()
        );
    }
}
