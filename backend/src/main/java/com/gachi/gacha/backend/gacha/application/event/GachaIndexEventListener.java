package com.gachi.gacha.backend.gacha.application.event;

import com.gachi.gacha.backend.gacha.application.GachaIndexService;
import java.util.List;
import java.util.stream.IntStream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class GachaIndexEventListener {

    private static final long BACKOFF_MS = 500L;
    private static final int CHUNK_SIZE = 500;
    private static final int MAX_ATTEMPTS = 3;

    private final GachaIndexService indexService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(final GachaChangedEvent e) {
        for (List<Long> chunk : partition(e.gachaIds())) {
            indexWithRetry(chunk);
        }
    }

    private void indexWithRetry(final List<Long> chunk) {
        for (int attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
            if (tryIndex(chunk, attempt)) {
                return;
            }
            if (attempt < MAX_ATTEMPTS) {
                sleep(attempt * BACKOFF_MS);
            }
        }
        log.error("ES 동기화 최종 실패 ids={}", chunk);
    }

    private boolean tryIndex(final List<Long> chunk, final int attempt) {
        try {
            indexService.indexAll(chunk);
            return true;
        } catch (Exception ex) {
            log.warn("ES 동기화 실패 attempt={} ids={}", attempt, chunk, ex);
            return false;
        }
    }

    private void sleep(final long ms) {
        try {
            Thread.sleep(ms);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
        }
    }

    private List<List<Long>> partition(final List<Long> ids) {
        return IntStream.range(0, (ids.size() + CHUNK_SIZE - 1) / CHUNK_SIZE)
                .mapToObj(i -> ids.subList(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, ids.size())))
                .toList();
    }
}
