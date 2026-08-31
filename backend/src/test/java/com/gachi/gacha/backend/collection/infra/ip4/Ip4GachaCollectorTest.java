package com.gachi.gacha.backend.collection.infra.ip4;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.infra.HtmlFetcher;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import org.junit.jupiter.api.Test;

class Ip4GachaCollectorTest {

    private static final String LIST_URL_TEMPLATE = "https://ip4.example/cupsuletoy_top/?search_date=%s";
    private static final String LIST_URL = "https://ip4.example/cupsuletoy_top/?search_date=201603";
    private static final String DETAIL_URL = "https://ip4.example/cupsuletoy/super-dorodango/";
    private static final Clock CLOCK = Clock.fixed(
            Instant.parse("2016-03-15T00:00:00Z"),
            ZoneOffset.UTC
    );

    @Test
    void 상세페이지의_게시물_ID를_상품코드로_수집한다() {
        final HtmlFetcher htmlFetcher = url -> {
            if (url.equals(LIST_URL)) {
                return """
                        <div id="cupsuletoy">
                          <ul>
                            <li>
                              <div class="image">
                                <a href="/cupsuletoy/super-dorodango/">
                                  <img src="/images/VD1475.jpg">
                                </a>
                              </div>
                              <dl>
                                <dt>2016年3月</dt>
                                <dd>
                                  <div class="brand">コロコロコレクション</div>
                                  スーパー泥だんご
                                  <div class="copy">copyright</div>
                                </dd>
                              </dl>
                            </li>
                          </ul>
                        </div>
                        """;
            }
            if (url.equals(DETAIL_URL)) {
                return """
                        <html>
                          <head><link rel="shortlink" href="https://ip4.example/?p=414"></head>
                          <body></body>
                        </html>
                        """;
            }
            throw new IllegalArgumentException("예상하지 못한 URL: " + url);
        };
        final Ip4GachaCollector collector = new Ip4GachaCollector(
                htmlFetcher,
                LIST_URL_TEMPLATE,
                100,
                0,
                1,
                CLOCK
        );

        final List<CollectedGacha> result = collector.collect();

        assertThat(result).singleElement().satisfies(gacha -> {
            assertThat(gacha.source()).isEqualTo(CollectionSource.IP4);
            assertThat(gacha.productCode()).isEqualTo("414");
            assertThat(gacha.name()).isEqualTo("スーパー泥だんご");
            assertThat(gacha.imageUrl()).isEqualTo("https://ip4.example/images/VD1475.jpg");
            assertThat(gacha.category()).isEqualTo("コロコロコレクション");
        });
    }

    @Test
    void 다음_페이지_링크가_있으면_계속_수집한다() {
        final String secondPageUrl = "https://ip4.example/cupsuletoy_top/page/2/?search_date=201603";
        final List<String> fetchedUrls = new ArrayList<>();
        final HtmlFetcher htmlFetcher = url -> {
            fetchedUrls.add(url);
            if (url.equals(LIST_URL)) {
                return """
                        <div id="cupsuletoy"><ul><li></li></ul></div>
                        <a class="next page-numbers" href="/cupsuletoy_top/page/2/?search_date=201603">&gt;</a>
                        """;
            }
            if (url.equals(secondPageUrl)) {
                return "<div id=\"cupsuletoy\"><ul></ul></div>";
            }
            throw new IllegalArgumentException("예상하지 못한 URL: " + url);
        };
        final Ip4GachaCollector collector = new Ip4GachaCollector(
                htmlFetcher,
                LIST_URL_TEMPLATE,
                100,
                0,
                1,
                CLOCK
        );

        collector.collect();

        assertThat(fetchedUrls).containsExactly(LIST_URL, secondPageUrl);
    }

    @Test
    void 현재_월을_포함해_최근_12개월을_수집한다() {
        final List<String> fetchedUrls = new ArrayList<>();
        final HtmlFetcher htmlFetcher = url -> {
            fetchedUrls.add(url);
            return "<div id=\"cupsuletoy\"><ul></ul></div>";
        };
        final Ip4GachaCollector collector = new Ip4GachaCollector(
                htmlFetcher,
                LIST_URL_TEMPLATE,
                100,
                0,
                12,
                CLOCK
        );

        collector.collect();

        assertThat(fetchedUrls).containsExactly(
                "https://ip4.example/cupsuletoy_top/?search_date=201603",
                "https://ip4.example/cupsuletoy_top/?search_date=201602",
                "https://ip4.example/cupsuletoy_top/?search_date=201601",
                "https://ip4.example/cupsuletoy_top/?search_date=201512",
                "https://ip4.example/cupsuletoy_top/?search_date=201511",
                "https://ip4.example/cupsuletoy_top/?search_date=201510",
                "https://ip4.example/cupsuletoy_top/?search_date=201509",
                "https://ip4.example/cupsuletoy_top/?search_date=201508",
                "https://ip4.example/cupsuletoy_top/?search_date=201507",
                "https://ip4.example/cupsuletoy_top/?search_date=201506",
                "https://ip4.example/cupsuletoy_top/?search_date=201505",
                "https://ip4.example/cupsuletoy_top/?search_date=201504"
        );
    }

    @Test
    void 시작_월_간격을_지정하면_이전_달부터_수집한다() {
        final List<String> fetchedUrls = new ArrayList<>();
        final HtmlFetcher htmlFetcher = url -> {
            fetchedUrls.add(url);
            return "<div id=\"cupsuletoy\"><ul></ul></div>";
        };
        final Ip4GachaCollector collector = new Ip4GachaCollector(
                htmlFetcher,
                LIST_URL_TEMPLATE,
                100,
                1,
                1,
                CLOCK
        );

        collector.collect();

        assertThat(fetchedUrls)
                .containsExactly("https://ip4.example/cupsuletoy_top/?search_date=201602");
    }
}
