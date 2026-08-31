package com.gachi.gacha.backend.collection.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.infra.platform.PlatformClient;
import com.gachi.gacha.backend.collection.infra.platform.PlatformType;
import com.gachi.gacha.backend.collection.infra.platform.dto.PlatformPostDto;
import com.gachi.gacha.backend.common.infra.application.ImageUploader;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.gacha.domain.GachaJpaRepository;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.function.Predicate;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class InstagramGachaCollectionServiceTest {

    @Mock
    private GachaJpaRepository gachaRepository;

    @Mock
    private ImageUploader imageUploader;

    private ExecutorService executorService;

    @BeforeEach
    void setUp() {
        executorService = Executors.newSingleThreadExecutor();
    }

    @AfterEach
    void tearDown() {
        executorService.shutdownNow();
    }

    @Test
    void 인스타그램_신규_게시물은_S3_이미지_URL과_수집_식별자를_저장한다() {
        PlatformPostDto post = new PlatformPostDto(
                "media-1",
                "신상 입고",
                "https://instagram.example/image.jpg",
                PlatformType.INSTAGRAM
        );
        InstagramGachaCollectionService service = service(new StubPlatformClient(post));
        given(gachaRepository.findInstagramMediaIdByInstagramMediaIdIn(anyList())).willReturn(List.of());
        given(imageUploader.uploadFromUrl(post.imageUrl(), "root/gacha"))
                .willReturn("https://bucket.s3.amazonaws.com/root/gacha/image.jpg");
        given(gachaRepository.save(any(Gacha.class))).willAnswer(invocation -> invocation.getArgument(0));

        List<Gacha> result = service.collectPostsForShop("shop");

        assertThat(result).hasSize(1);
        ArgumentCaptor<Gacha> captor = ArgumentCaptor.forClass(Gacha.class);
        verify(gachaRepository).save(captor.capture());
        assertThat(captor.getValue()).satisfies(gacha -> {
            assertThat(gacha.getSource()).isEqualTo(CollectionSource.INSTAGRAM);
            assertThat(gacha.getProductCode()).isEqualTo("media-1");
            assertThat(gacha.getInstagramMediaId()).isEqualTo("media-1");
            assertThat(gacha.getThumbnailUrl())
                    .isEqualTo("https://bucket.s3.amazonaws.com/root/gacha/image.jpg");
        });
    }

    private InstagramGachaCollectionService service(final PlatformClient platformClient) {
        return new InstagramGachaCollectionService(
                List.of(platformClient),
                gachaRepository,
                imageUploader,
                executorService,
                "root"
        );
    }

    private record StubPlatformClient(PlatformPostDto post) implements PlatformClient {

        @Override
        public List<PlatformPostDto> fetchRecentPosts(
                final String targetId,
                final Predicate<List<PlatformPostDto>> shouldStopAfterPage
        ) {
            return List.of(post);
        }

        @Override
        public PlatformType getPlatformType() {
            return PlatformType.INSTAGRAM;
        }
    }
}
