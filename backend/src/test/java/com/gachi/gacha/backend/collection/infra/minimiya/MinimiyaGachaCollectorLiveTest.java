package com.gachi.gacha.backend.collection.infra.minimiya;

import static org.assertj.core.api.Assertions.assertThat;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.infra.JdkHtmlFetcher;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 실제 미니미야 사이트에 요청해 셀렉터가 맞는지 확인하는 수동 테스트.
 * DB/S3에는 아무것도 저장하지 않는다.
 * 실행: MINIMIYA_LIVE=true ./gradlew test --tests '*MinimiyaGachaCollectorLiveTest' -i
 */
@EnabledIfEnvironmentVariable(named = "MINIMIYA_LIVE", matches = "true")
class MinimiyaGachaCollectorLiveTest {

    private static final String SEARCH_URL =
            "https://minimiya.co.kr/product/search.html?keyword=%EC%B9%98%EC%9D%B4%EC%B9%B4%EC%99%80";

    @Test
    void 실제_사이트에서_치이카와_가챠를_수집한다() {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build();
        JdkHtmlFetcher fetcher = new JdkHtmlFetcher(
                httpClient,
                Duration.ofSeconds(15),
                Duration.ofSeconds(1),
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36"
        );
        MinimiyaGachaCollector collector = new MinimiyaGachaCollector(fetcher);
        ReflectionTestUtils.setField(collector, "searchUrl", SEARCH_URL);
        ReflectionTestUtils.setField(collector, "maxPages", 30);
        ReflectionTestUtils.setField(collector, "gachaKeywords", List.of("가챠", "캡슐"));

        List<CollectedGacha> result = collector.collect();

        System.out.println("=== 수집 결과: " + result.size() + "건");
        result.forEach(gacha -> System.out.printf("%s | %s | %s%n",
                gacha.productCode(), gacha.name(), gacha.imageUrl()));
        assertThat(result).isNotEmpty();
    }
}
