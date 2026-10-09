package com.gachi.gacha.backend.collection.infra.minimiya;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.domain.GachaCollector;
import com.gachi.gacha.backend.collection.infra.HtmlFetcher;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import lombok.RequiredArgsConstructor;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class MinimiyaGachaCollector implements GachaCollector {

    private static final Pattern PRODUCT_NO_QUERY = Pattern.compile("[?&]product_no=(\\d+)");
    private static final Pattern PRODUCT_NO_SEO = Pattern.compile("/product/[^/]+/(\\d+)/"); // Cafe24 SEO URL 대비
    private static final Pattern NAME_LABEL = Pattern.compile("^상품명\\s*:\\s*");

    private final HtmlFetcher htmlFetcher;
    @Value("${collection.sources.minimiya.search-url}")
    private String searchUrl;          // ...search.html?keyword=치이카와 (인코딩된 값)
    @Value("${collection.sources.minimiya.max-pages:30}")
    private int maxPages;
    @Value("${collection.sources.minimiya.gacha-keywords:가챠,캡슐}")
    private List<String> gachaKeywords; // 검색 결과 중 상품명에 이 단어가 하나라도 있어야 가챠로 판단

    @Override
    public CollectionSource source() {
        return CollectionSource.MINIMIYA;
    }

    @Override
    public List<CollectedGacha> collect() {
        Map<String, CollectedGacha> collected = new LinkedHashMap<>();
        for (int page = 1; page <= maxPages; page++) {
            String url = searchUrl + "&page=" + page;
            Document document = Jsoup.parse(htmlFetcher.fetch(url), url);
            List<Element> items = document.select("ul.prdList > li[id^=anchorBoxId_]");
            int before = collected.size();
            items.stream()
                    .map(this::toCollectedGacha)
                    .flatMap(Optional::stream)
                    .forEach(g -> collected.putIfAbsent(g.productCode(), g));
            // 마지막 페이지 다음은 빈 목록이 오지만, 같은 페이지가 반복되는 경우도 대비해 "새 상품 없음"도 종료 조건으로 둔다
            if (items.isEmpty() || collected.size() == before) {
                break;
            }
        }
        return new ArrayList<>(collected.values());
    }

    private Optional<CollectedGacha> toCollectedGacha(final Element item) {
        Element nameLink = item.selectFirst("p.name a[href]");
        Element image = item.selectFirst("img.thumb");
        if (nameLink == null || image == null) {
            return Optional.empty();
        }
        String productNo = extractProductNo(nameLink.absUrl("href"));
        String name = NAME_LABEL.matcher(nameLink.text().trim()).replaceFirst("");
        String imageUrl = image.absUrl("src");   // //minimiya.co.kr/... 같은 프로토콜 상대경로도 absUrl이 처리
        if (productNo == null || imageUrl.isBlank() || !isGacha(name)) {
            return Optional.empty();
        }
        return Optional.of(new CollectedGacha(source(), productNo, name, imageUrl, null)); // 카테고리는 직접 정제
    }

    private boolean isGacha(final String name) {
        return gachaKeywords.stream()
                .map(String::trim)
                .filter(keyword -> !keyword.isBlank())
                .anyMatch(name::contains);
    }

    private String extractProductNo(final String href) {
        for (Pattern p : List.of(PRODUCT_NO_QUERY, PRODUCT_NO_SEO)) {
            Matcher m = p.matcher(href);
            if (m.find()) {
                return m.group(1);
            }
        }
        return null;
    }
}
