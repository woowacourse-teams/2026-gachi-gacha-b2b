package com.gachi.gacha.backend.collection.infra.bandai;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.infra.HtmlFetcher;
import java.util.List;
import org.junit.jupiter.api.Test;

class BandaiGachaCollectorTest {

    private static final String LIST_URL = "https://bandai.example/items?pageNo=1";

    @Test
    void 상품목록의_모든_페이지를_수집한다() {
        final HtmlFetcher htmlFetcher = url -> {
            if (url.endsWith("pageNo=1")) {
                return """
                        <div class="wm-column-item">
                          <a href="/item/item_details.html?product_code=4582769995552">
                            <figure><img src="/images/bandai-1.jpg"></figure>
                            <p>カーケシGP NISSANセレクション01</p>
                            <p class="itemList_price">400円</p>
                          </a>
                        </div>
                        <a href="/items?pageNo=2">다음</a>
                        """;
            }
            return """
                    <div class="wm-column-item">
                      <a href="/item/item_details.html?product_code=4582769995569">
                        <figure><img src="/images/bandai-2.jpg"></figure>
                        <p>カーケシGP MAZDAセレクション01</p>
                        <p class="itemList_price">400円</p>
                      </a>
                    </div>
                    """;
        };
        final BandaiGachaCollector collector = new BandaiGachaCollector(htmlFetcher, LIST_URL, 1, 10);

        final List<CollectedGacha> result = collector.collect();

        assertThat(result).hasSize(2);
        assertThat(result.getFirst()).satisfies(gacha -> {
            assertThat(gacha.source()).isEqualTo(CollectionSource.BANDAI);
            assertThat(gacha.productCode()).isEqualTo("4582769995552");
            assertThat(gacha.name()).isEqualTo("カーケシGP NISSANセレクション01");
            assertThat(gacha.imageUrl()).isEqualTo("https://bandai.example/images/bandai-1.jpg");
            assertThat(gacha.category()).isNull();
        });
    }

    @Test
    void 지정한_페이지부터_수집한다() {
        final HtmlFetcher htmlFetcher = url -> {
            assertThat(url).endsWith("pageNo=2");
            return """
                    <div class="wm-column-item">
                      <a href="/item/item_details.html?product_code=page-two-product">
                        <img src="/images/page-two.jpg">
                        <p>2페이지 상품</p>
                      </a>
                    </div>
                    """;
        };
        final BandaiGachaCollector collector = new BandaiGachaCollector(htmlFetcher, LIST_URL, 2, 1);

        final List<CollectedGacha> result = collector.collect();

        assertThat(result).singleElement()
                .extracting(CollectedGacha::productCode)
                .isEqualTo("page-two-product");
    }
}
