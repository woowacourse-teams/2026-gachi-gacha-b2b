package com.gachi.gacha.backend.common.infra.application.event;

import com.gachi.gacha.backend.common.infra.application.SearchSynonymSyncService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Slf4j
@Component
@RequiredArgsConstructor
public class SearchSynonymSyncEventListener {

    private final SearchSynonymSyncService syncService;

    @Async
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handel(SearchSynonymChangedEvent event) {
        try {
            syncService.syncAll(event.synonymSet());
        } catch (Exception ex) {
            log.error("동의어 동기화 실패 set={}", event.synonymSet(), ex);
        }
    }
}
