package com.gachi.gacha.backend.collection.infra.minimiya;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.infra.HtmlFetcher;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

class MinimiyaGachaCollectorTest {
    @Test
    void 상품번호와_상품정보를_수집한다() {
        HtmlFetcher fetcher = url -> url.endsWith("page=1") ? """
        <ul class="prdList"><li id="anchorBoxId_1846" class="item xans-record-"><div class="box">
            <a href="/product/detail.html?product_no=1846&cate_no=43&display_group=1"><img src="//minimiya.co.kr/web/product/medium/202206/a.jpg" class="thumb"></a>
            <p class="name"><a href="/product/detail.html?product_no=1846&cate_no=43&display_group=1"><span style="font-size:12px;">잠자는 치이카와 가챠캡슐 4종세트</span></a><br></p>
            <strong class="grid">16,000원</strong>
          </div></li></ul>""" : "<ul class='prdList'></ul>";
        MinimiyaGachaCollector collector = new MinimiyaGachaCollector(fetcher);
        ReflectionTestUtils.setField(collector, "searchUrl", "https://minimiya.co.kr/product/search.html?keyword=x");
        ReflectionTestUtils.setField(collector, "maxPages", 5);
        ReflectionTestUtils.setField(collector, "gachaKeywords", List.of("가챠", "캡슐"));

        assertThat(collector.collect()).singleElement().satisfies(g -> {
            assertThat(g.source()).isEqualTo(CollectionSource.MINIMIYA);
            assertThat(g.productCode()).isEqualTo("1846");
            assertThat(g.name()).isEqualTo("잠자는 치이카와 가챠캡슐 4종세트");
            assertThat(g.imageUrl()).isEqualTo("https://minimiya.co.kr/web/product/medium/202206/a.jpg");
            assertThat(g.category()).isNull();
        });
    }

    @Test
    void 가챠가_아닌_검색결과는_제외한다() {
        HtmlFetcher fetcher = url -> url.endsWith("page=1") ? """
        <ul class="prdList">
          <li id="anchorBoxId_1846" class="item xans-record-"><div class="box">
            <a href="/product/detail.html?product_no=1846&cate_no=43&display_group=1"><img src="//minimiya.co.kr/a.jpg" class="thumb"></a>
            <p class="name"><a href="/product/detail.html?product_no=1846&cate_no=43&display_group=1"><span style="font-size:12px;">잠자는 치이카와 가챠캡슐 4종세트</span></a><br></p>
            <strong class="grid">16,000원</strong>
          </div></li>
          <li id="anchorBoxId_2000" class="item xans-record-"><div class="box">
            <a href="/product/detail.html?product_no=2000&cate_no=43&display_group=1"><img src="//minimiya.co.kr/b.jpg" class="thumb"></a>
            <p class="name"><a href="/product/detail.html?product_no=2000&cate_no=43&display_group=1"><span style="font-size:12px;">치이카와 누이구루미 인형</span></a><br></p>
            <strong class="grid">16,000원</strong>
          </div></li>
        </ul>""" : "<ul class='prdList'></ul>";
        MinimiyaGachaCollector collector = new MinimiyaGachaCollector(fetcher);
        ReflectionTestUtils.setField(collector, "searchUrl", "https://minimiya.co.kr/product/search.html?keyword=x");
        ReflectionTestUtils.setField(collector, "maxPages", 5);
        ReflectionTestUtils.setField(collector, "gachaKeywords", List.of("가챠", "캡슐"));

        assertThat(collector.collect())
                .extracting(gacha -> gacha.productCode())
                .containsExactly("1846");
    }

    @Test
    void 같은_페이지가_반복되면_수집을_멈춘다() {
        String samePage = """
        <ul class="prdList"><li id="anchorBoxId_1846" class="item xans-record-"><div class="box">
            <a href="/product/detail.html?product_no=1846&cate_no=43&display_group=1"><img src="//minimiya.co.kr/a.jpg" class="thumb"></a>
            <p class="name"><a href="/product/detail.html?product_no=1846&cate_no=43&display_group=1"><span style="font-size:12px;">잠자는 치이카와 가챠캡슐 4종세트</span></a><br></p>
            <strong class="grid">16,000원</strong>
          </div></li></ul>""";
        int[] calls = {0};
        HtmlFetcher fetcher = url -> {
            calls[0]++;
            return samePage;
        };
        MinimiyaGachaCollector collector = new MinimiyaGachaCollector(fetcher);
        ReflectionTestUtils.setField(collector, "searchUrl", "https://minimiya.co.kr/product/search.html?keyword=x");
        ReflectionTestUtils.setField(collector, "maxPages", 30);
        ReflectionTestUtils.setField(collector, "gachaKeywords", List.of("가챠", "캡슐"));

        assertThat(collector.collect()).hasSize(1);
        assertThat(calls[0]).isEqualTo(2);
    }
}
