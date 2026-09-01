package com.gachi.gacha.backend.collection.presentation;

import static com.gachi.gacha.backend.common.exception.ErrorCode.GACHA_COLLECTION_FAILED;
import static com.gachi.gacha.backend.common.exception.ErrorCode.INVALID_COLLECTION_SOURCE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.backend.collection.application.CollectionResult;
import com.gachi.gacha.backend.collection.application.GachaCollectionFacade;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.domain.GachaCollectionException;
import java.time.Instant;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;

class ManualGachaCollectionRunnerTest {

    @Test
    void 지정한_출처만_한_번_수집한다() {
        GachaCollectionFacade facade = mock(GachaCollectionFacade.class);
        CollectionResult result = CollectionResult.success(
                CollectionSource.BANDAI,
                2,
                1,
                Instant.now()
        );
        given(facade.collect(CollectionSource.BANDAI)).willReturn(result);
        ManualGachaCollectionRunner runner = new ManualGachaCollectionRunner(facade, "bandai");

        runner.run(mock(ApplicationArguments.class));

        verify(facade).collect(CollectionSource.BANDAI);
    }

    @Test
    void ALL을_지정하면_모든_출처를_수집한다() {
        GachaCollectionFacade facade = mock(GachaCollectionFacade.class);
        given(facade.collectAll()).willReturn(List.of());
        ManualGachaCollectionRunner runner = new ManualGachaCollectionRunner(facade, "ALL");

        runner.run(mock(ApplicationArguments.class));

        verify(facade).collectAll();
    }

    @Test
    void 지원하지_않는_출처는_실행하지_않는다() {
        GachaCollectionFacade facade = mock(GachaCollectionFacade.class);
        ManualGachaCollectionRunner runner = new ManualGachaCollectionRunner(facade, "UNKNOWN");

        assertThatThrownBy(() -> runner.run(mock(ApplicationArguments.class)))
                .isInstanceOfSatisfying(
                        GachaCollectionException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(INVALID_COLLECTION_SOURCE)
                )
                .hasMessageContaining("BANDAI, IP4, A_MUZU, ALL");
    }

    @Test
    void 수집_결과가_실패이면_프로세스가_실패하도록_예외를_발생시킨다() {
        GachaCollectionFacade facade = mock(GachaCollectionFacade.class);
        given(facade.collect(CollectionSource.IP4)).willReturn(
                CollectionResult.failure(CollectionSource.IP4, Instant.now())
        );
        ManualGachaCollectionRunner runner = new ManualGachaCollectionRunner(facade, "IP4");

        assertThatThrownBy(() -> runner.run(mock(ApplicationArguments.class)))
                .isInstanceOfSatisfying(
                        GachaCollectionException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(GACHA_COLLECTION_FAILED)
                )
                .hasMessageContaining("일부 가챠 수집에 실패");
    }
}
