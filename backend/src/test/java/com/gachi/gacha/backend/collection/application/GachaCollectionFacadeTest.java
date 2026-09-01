package com.gachi.gacha.backend.collection.application;

import static com.gachi.gacha.backend.common.exception.ErrorCode.GACHA_COLLECTION_FAILED;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.domain.GachaCollectionException;
import com.gachi.gacha.backend.collection.domain.GachaCollector;
import java.util.List;
import org.junit.jupiter.api.Test;

class GachaCollectionFacadeTest {

    @Test
    void 한_수집기가_실패해도_나머지_수집기를_계속_실행한다() {
        GachaCollector bandaiCollector = collector(CollectionSource.BANDAI);
        GachaCollector ip4Collector = collector(CollectionSource.IP4);
        GachaCollector amuzuCollector = collector(CollectionSource.A_MUZU);
        GachaCollectionService service = mock(GachaCollectionService.class);
        CollectedGacha ip4Gacha = gacha(CollectionSource.IP4, "414");
        CollectedGacha amuzuGacha = gacha(CollectionSource.A_MUZU, "C69710");

        given(bandaiCollector.collect()).willThrow(
                new GachaCollectionException(GACHA_COLLECTION_FAILED, "수집 실패")
        );
        given(ip4Collector.collect()).willReturn(List.of(ip4Gacha));
        given(amuzuCollector.collect()).willReturn(List.of(amuzuGacha));
        given(service.saveNewGachas(CollectionSource.IP4, List.of(ip4Gacha))).willReturn(1);
        given(service.saveNewGachas(CollectionSource.A_MUZU, List.of(amuzuGacha))).willReturn(0);

        GachaCollectionFacade facade = new GachaCollectionFacade(
                List.of(bandaiCollector, ip4Collector, amuzuCollector),
                service
        );
        List<CollectionResult> results = facade.collectAll();

        assertThat(results).extracting(CollectionResult::source)
                .containsExactly(CollectionSource.BANDAI, CollectionSource.IP4, CollectionSource.A_MUZU);
        assertThat(results.get(0).succeeded()).isFalse();
        assertThat(results.get(1).insertedCount()).isEqualTo(1);
        assertThat(results.get(2).skippedCount()).isEqualTo(1);
        verify(ip4Collector).collect();
        verify(amuzuCollector).collect();
    }

    private GachaCollector collector(final CollectionSource source) {
        GachaCollector collector = mock(GachaCollector.class);
        given(collector.source()).willReturn(source);
        return collector;
    }

    private CollectedGacha gacha(final CollectionSource source, final String productCode) {
        return new CollectedGacha(
                source,
                productCode,
                source.name() + " 상품",
                "https://example.com/image.jpg"
        );
    }
}
