package com.gachi.gacha.backend.collection.scheduler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.backend.collection.application.CollectionResult;
import com.gachi.gacha.backend.collection.application.GachaCollectionFacade;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import java.time.Instant;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.Test;

class GachaCollectionSchedulerTest {

    @Test
    void 스케줄이_실행되면_모든_출처를_수집한다() {
        GachaCollectionFacade facade = mock(GachaCollectionFacade.class);
        Instant startedAt = Instant.now();
        given(facade.collectAll()).willReturn(List.of(
                CollectionResult.success(CollectionSource.BANDAI, 2, 1, startedAt)
        ));
        GachaCollectionScheduler scheduler = new GachaCollectionScheduler(facade);

        scheduler.collectGachas();

        verify(facade).collectAll();
    }

    @Test
    void 이전_수집이_진행_중이면_중복_실행을_건너뛴다() throws InterruptedException {
        GachaCollectionFacade facade = mock(GachaCollectionFacade.class);
        CountDownLatch collectionStarted = new CountDownLatch(1);
        CountDownLatch collectionCanFinish = new CountDownLatch(1);
        given(facade.collectAll()).willAnswer(invocation -> {
            collectionStarted.countDown();
            collectionCanFinish.await();
            return List.of();
        });
        GachaCollectionScheduler scheduler = new GachaCollectionScheduler(facade);

        Thread firstExecution = Thread.ofVirtual().start(scheduler::collectGachas);
        try {
            assertThat(collectionStarted.await(1, TimeUnit.SECONDS)).isTrue();
            scheduler.collectGachas();
        } finally {
            collectionCanFinish.countDown();
            firstExecution.join(1_000);
        }

        assertThat(firstExecution.isAlive()).isFalse();
        verify(facade, times(1)).collectAll();
    }
}
