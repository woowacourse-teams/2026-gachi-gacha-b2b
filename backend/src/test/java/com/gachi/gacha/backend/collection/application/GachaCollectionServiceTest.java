package com.gachi.gacha.backend.collection.application;

import static com.gachi.gacha.backend.common.exception.ErrorCode.COLLECTION_SOURCE_MISMATCH;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.domain.GachaCollectionException;
import com.gachi.gacha.backend.common.infra.application.ImageUploader;
import com.gachi.gacha.backend.common.infra.domain.ImageType;
import com.gachi.gacha.backend.common.util.S3TransactionManager;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.gacha.domain.GachaJpaRepository;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class GachaCollectionServiceTest {

    @Mock
    private GachaJpaRepository gachaRepository;

    @Mock
    private ImageUploader imageUploader;

    @Mock
    private S3TransactionManager s3TransactionManager;

    @Test
    @SuppressWarnings("unchecked")
    void source와_productCode가_같은_기존_가챠는_저장하지_않는다() {
        GachaCollectionService service = service();
        List<CollectedGacha> collectedGachas = List.of(
                gacha(CollectionSource.BANDAI, "existing", "기존 상품"),
                gacha(CollectionSource.BANDAI, "new", "신규 상품"),
                gacha(CollectionSource.BANDAI, "new", "중복 신규 상품")
        );
        given(gachaRepository.findExistingProductCodes(eq(CollectionSource.BANDAI), anyCollection()))
                .willReturn(Set.of("existing"));
        given(imageUploader.uploadFromUrl(
                "https://example.com/image.jpg",
                ImageType.GACHA.buildPath("root")
        )).willReturn("https://bucket.s3.amazonaws.com/root/gacha/new.jpg");

        int insertedCount = service.saveNewGachas(CollectionSource.BANDAI, collectedGachas);

        assertThat(insertedCount).isEqualTo(1);
        ArgumentCaptor<List<Gacha>> captor = ArgumentCaptor.forClass(List.class);
        verify(gachaRepository).saveAll(captor.capture());
        assertThat(captor.getValue())
                .singleElement()
                .satisfies(gacha -> {
                    assertThat(gacha.getSource()).isEqualTo(CollectionSource.BANDAI);
                    assertThat(gacha.getProductCode()).isEqualTo("new");
                    assertThat(gacha.getName()).isEqualTo("신규 상품");
                    assertThat(gacha.getThumbnailUrl())
                            .isEqualTo("https://bucket.s3.amazonaws.com/root/gacha/new.jpg");
                });
        verify(imageUploader, times(1)).uploadFromUrl(
                "https://example.com/image.jpg",
                "root/gacha"
        );
        verify(s3TransactionManager).deleteImagesOnRollback(
                eq(ImageType.GACHA),
                isNull(),
                anyList()
        );
    }

    @Test
    void 수집_출처가_요청_출처와_다르면_저장하지_않는다() {
        GachaCollectionService service = service();
        List<CollectedGacha> collectedGachas = List.of(
                gacha(CollectionSource.IP4, "414", "IP4 상품")
        );

        assertThatThrownBy(() -> service.saveNewGachas(CollectionSource.BANDAI, collectedGachas))
                .isInstanceOfSatisfying(
                        GachaCollectionException.class,
                        exception -> assertThat(exception.getErrorCode()).isEqualTo(COLLECTION_SOURCE_MISMATCH)
                );
        verify(gachaRepository, never()).saveAll(org.mockito.ArgumentMatchers.<Gacha>anyList());
    }

    @Test
    void 모든_상품이_중복이면_S3에_업로드하지_않는다() {
        GachaCollectionService service = service();
        List<CollectedGacha> collectedGachas = List.of(
                gacha(CollectionSource.IP4, "414", "기존 IP4 상품")
        );
        given(gachaRepository.findExistingProductCodes(CollectionSource.IP4, Set.of("414")))
                .willReturn(Set.of("414"));

        int insertedCount = service.saveNewGachas(CollectionSource.IP4, collectedGachas);

        assertThat(insertedCount).isZero();
        verify(imageUploader, never()).uploadFromUrl(
                org.mockito.ArgumentMatchers.anyString(),
                org.mockito.ArgumentMatchers.anyString()
        );
        verify(s3TransactionManager, never()).deleteImagesOnRollback(
                org.mockito.ArgumentMatchers.any(),
                org.mockito.ArgumentMatchers.any(),
                anyList()
        );
    }

    private GachaCollectionService service() {
        GachaCollectionService service = new GachaCollectionService(
                gachaRepository,
                imageUploader,
                s3TransactionManager
        );
        ReflectionTestUtils.setField(service, "s3RootFolder", "root");
        return service;
    }

    private CollectedGacha gacha(
            final CollectionSource source,
            final String productCode,
            final String name
    ) {
        return new CollectedGacha(source, productCode, name, "https://example.com/image.jpg");
    }
}
