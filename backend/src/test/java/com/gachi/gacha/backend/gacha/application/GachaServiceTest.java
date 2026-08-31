package com.gachi.gacha.backend.gacha.application;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.common.infra.application.ImageUploader;
import com.gachi.gacha.backend.common.infra.domain.ImageType;
import com.gachi.gacha.backend.common.util.S3TransactionManager;
import com.gachi.gacha.backend.gacha.application.dto.GachaUpdateCommand;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.gacha.domain.GachaJpaRepository;
import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
class GachaServiceTest {

    @Mock
    private GachaJpaRepository gachaRepository;

    @Mock
    private S3TransactionManager s3TransactionManager;

    @Mock
    private ImageUploader imageUploader;

    private GachaService service() {
        return new GachaService(gachaRepository, s3TransactionManager, imageUploader, "test");
    }

    @Test
    @DisplayName("가챠 정보를 부분 수정하면 요청한 필드만 갱신되고 저장된다.")
    void modify_updatesFields_andPersists() {
        // given
        Gacha gacha = Gacha.builder()
                .id(1L)
                .name("임시 이름")
                .caption("입고 안내")
                .thumbnailUrl("https://example.com/thumb.jpg")
                .instagramMediaId("media-1")
                .category("키링")
                .source(CollectionSource.BANDAI)
                .productCode("BANDAI-001")
                .build();
        when(gachaRepository.getById(1L)).thenReturn(gacha);
        when(gachaRepository.save(gacha)).thenReturn(gacha);

        // when
        service().modify(
                1L,
                new GachaUpdateCommand("정식 상품명", "새 설명", "https://example.com/new.jpg", "피규어")
        );

        // then
        assertThat(gacha.getName()).isEqualTo("정식 상품명");
        assertThat(gacha.getCaption()).isEqualTo("새 설명");
        assertThat(gacha.getThumbnailUrl()).isEqualTo("https://example.com/new.jpg");
        assertThat(gacha.getCategory()).isEqualTo("피규어");
        assertThat(gacha.getSource()).isEqualTo(CollectionSource.BANDAI);
        assertThat(gacha.getProductCode()).isEqualTo("BANDAI-001");
        verify(gachaRepository).save(gacha);
    }

    @Test
    @DisplayName("PATCH 요청에서 누락한 가챠 필드는 기존 값을 유지한다.")
    void modify_preservesOmittedFields() {
        // given
        Gacha gacha = Gacha.builder()
                .id(1L)
                .name("기존 이름")
                .caption("기존 설명")
                .thumbnailUrl("https://example.com/thumb.jpg")
                .category("기존 카테고리")
                .build();
        when(gachaRepository.getById(1L)).thenReturn(gacha);
        when(gachaRepository.save(gacha)).thenReturn(gacha);

        // when
        service().modify(1L, new GachaUpdateCommand(null, null, null, "새 카테고리"));

        // then
        assertThat(gacha.getName()).isEqualTo("기존 이름");
        assertThat(gacha.getCaption()).isEqualTo("기존 설명");
        assertThat(gacha.getThumbnailUrl()).isEqualTo("https://example.com/thumb.jpg");
        assertThat(gacha.getCategory()).isEqualTo("새 카테고리");
        verify(gachaRepository).save(gacha);
    }

    @Test
    @DisplayName("가챠를 삭제하면 썸네일 이미지를 S3 휴지통으로 이동한다.")
    void remove_trashesThumbnailImage() {
        // given
        Gacha gacha = Gacha.builder()
                .id(1L)
                .name("삭제할 가챠")
                .thumbnailUrl("https://example.com/gacha/thumbnail.jpg")
                .build();
        when(gachaRepository.getById(1L)).thenReturn(gacha);

        // when
        service().remove(1L);

        // then
        verify(gachaRepository).deleteById(1L);
        verify(s3TransactionManager).trashImagesAfterRemoved(
                ImageType.GACHA,
                1L,
                List.of("https://example.com/gacha/thumbnail.jpg")
        );
    }

    @Test
    @DisplayName("가챠 썸네일을 업로드하면 S3 URL을 Gacha에 저장한다.")
    void updateThumbnail_savesS3UrlToGacha() {
        // given
        Gacha gacha = Gacha.builder()
                .id(1L)
                .name("가챠")
                .thumbnailUrl("https://test-bucket.s3.amazonaws.com/test/gacha/old.png")
                .build();
        MockMultipartFile image = new MockMultipartFile(
                "image",
                "new.png",
                "image/png",
                "image".getBytes()
        );
        when(gachaRepository.getById(1L)).thenReturn(gacha);
        when(gachaRepository.save(gacha)).thenReturn(gacha);
        when(imageUploader.upload(any(), anyString()))
                .thenReturn("https://test-bucket.s3.amazonaws.com/test/gacha/new.png");

        // when
        service().updateThumbnail(1L, image);

        // then
        assertThat(gacha.getThumbnailUrl())
                .isEqualTo("https://test-bucket.s3.amazonaws.com/test/gacha/new.png");
        verify(gachaRepository).save(gacha);
        verify(s3TransactionManager).cleanupAfterImageReplaced(
                ImageType.GACHA,
                1L,
                "https://test-bucket.s3.amazonaws.com/test/gacha/old.png",
                "https://test-bucket.s3.amazonaws.com/test/gacha/new.png"
        );
    }

    @Test
    @DisplayName("가챠 썸네일을 삭제하면 Gacha의 URL을 비운다.")
    void removeThumbnail_clearsGachaThumbnailUrl() {
        // given
        String oldImageUrl = "https://test-bucket.s3.amazonaws.com/test/gacha/old.png";
        Gacha gacha = Gacha.builder()
                .id(1L)
                .name("가챠")
                .thumbnailUrl(oldImageUrl)
                .build();
        when(gachaRepository.getById(1L)).thenReturn(gacha);
        when(gachaRepository.save(gacha)).thenReturn(gacha);

        // when
        service().removeThumbnail(1L);

        // then
        assertThat(gacha.getThumbnailUrl()).isNull();
        verify(gachaRepository).save(gacha);
        verify(s3TransactionManager).trashImagesAfterRemoved(
                ImageType.GACHA,
                1L,
                List.of(oldImageUrl)
        );
    }
}
