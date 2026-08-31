package com.gachi.gacha.backend.gacha.domain;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.gacha.application.dto.GachaCreateCommand;
import org.junit.jupiter.api.Test;

class GachaTest {

    @Test
    void 수집된_가챠를_정제해도_수집_식별자는_유지한다() {
        Gacha gacha = new Gacha(
                "수집 이름",
                "https://example.com/collected.jpg",
                CollectionSource.BANDAI,
                "product-1",
                "수집 카테고리"
        );

        gacha.update(
                "정제 이름",
                "정제 설명",
                "https://example.com/cleaned.jpg",
                "정제 카테고리"
        );

        assertThat(gacha.getName()).isEqualTo("정제 이름");
        assertThat(gacha.getThumbnailUrl()).isEqualTo("https://example.com/cleaned.jpg");
        assertThat(gacha.getCategory()).isEqualTo("정제 카테고리");
        assertThat(gacha.getSource()).isEqualTo(CollectionSource.BANDAI);
        assertThat(gacha.getProductCode()).isEqualTo("product-1");
    }

    @Test
    void 관리자가_직접_생성한_가챠는_MANUAL_출처를_사용한다() {
        GachaCreateCommand command = GachaCreateCommand.builder()
                .name("수동 등록 가챠")
                .thumbnailUrl("https://example.com/manual.jpg")
                .category("수동 카테고리")
                .build();

        Gacha gacha = command.toEntity();

        assertThat(gacha.getSource()).isEqualTo(CollectionSource.MANUAL);
        assertThat(gacha.getProductCode()).isNull();
        assertThat(gacha.getCategory()).isEqualTo("수동 카테고리");
    }
}
