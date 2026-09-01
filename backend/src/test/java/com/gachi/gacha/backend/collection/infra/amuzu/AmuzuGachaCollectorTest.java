package com.gachi.gacha.backend.collection.infra.amuzu;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.infra.HtmlFetcher;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class AmuzuGachaCollectorTest {

    private static final String LIST_URL = "https://amuzu.example/category/CAPSULE_TOY_006/";

    @Test
    void 상품코드와_상품정보를_수집한다() {
        HtmlFetcher htmlFetcher = url -> """
                <div class="p-list-item">
                  <div class="p-list-item__image">
                    <a class="p-list-item__image-link" href="/category/CAPSULE_TOY_006/C69710.html">
                      <img src="/images/C69710.jpg">
                    </a>
                  </div>
                  <p class="p-list-item__title">
                    <a class="p-list-item__title-link" href="/category/CAPSULE_TOY_006/C69710.html">
                      バルーンわんちゃん（30個入り）
                    </a>
                  </p>
                  <p>商品コード：C69710</p>
                </div>
                """;
        AmuzuGachaCollector collector = new AmuzuGachaCollector(htmlFetcher);
        ReflectionTestUtils.setField(collector, "listUrl", LIST_URL);
        ReflectionTestUtils.setField(collector, "category", "CAPSULE_TOY_006");
        ReflectionTestUtils.setField(collector, "maxPages", 10);

        List<CollectedGacha> result = collector.collect();

        assertThat(result).singleElement().satisfies(gacha -> {
            assertThat(gacha.source()).isEqualTo(CollectionSource.A_MUZU);
            assertThat(gacha.productCode()).isEqualTo("C69710");
            assertThat(gacha.name()).isEqualTo("バルーンわんちゃん（30個入り）");
            assertThat(gacha.imageUrl()).isEqualTo("https://amuzu.example/images/C69710.jpg");
            assertThat(gacha.category()).isEqualTo("CAPSULE_TOY_006");
        });
    }
}
