package com.gachi.gacha.backend.collection.infra.amuzu;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.domain.GachaCollector;
import com.gachi.gacha.backend.collection.infra.HtmlFetcher;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
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
public class AmuzuGachaCollector implements GachaCollector {

    private static final Pattern PRODUCT_CODE_TEXT_PATTERN = Pattern.compile("商品コード[：:]\\s*([A-Za-z0-9_-]+)");
    private static final Pattern PRODUCT_CODE_URL_PATTERN = Pattern.compile("/([A-Za-z][A-Za-z0-9_-]*)\\.html(?:[?#]|$)");

    private final HtmlFetcher htmlFetcher;
    @Value("${collection.sources.amuzu.list-url}")
    private String listUrl;
    @Value("${collection.sources.amuzu.category:CAPSULE_TOY_006}")
    private String category;
    @Value("${collection.sources.amuzu.max-pages:100}")
    private int maxPages;

    @Override
    public CollectionSource source() {
        return CollectionSource.A_MUZU;
    }

    @Override
    public List<CollectedGacha> collect() {
        Map<String, CollectedGacha> collected = new LinkedHashMap<>();
        Set<String> visitedUrls = new HashSet<>();
        String currentUrl = listUrl;

        for (int page = 1; page <= maxPages && visitedUrls.add(currentUrl); page++) {
            Document document = Jsoup.parse(htmlFetcher.fetch(currentUrl), currentUrl);
            if (!collectPage(document, collected)) {
                break;
            }

            String nextUrl = nextPageUrl(document, page + 1);
            if (nextUrl == null) {
                break;
            }
            currentUrl = nextUrl;
        }

        return new ArrayList<>(collected.values());
    }

    private boolean collectPage(
            final Document document,
            final Map<String, CollectedGacha> collected
    ) {
        List<Element> titleLinks = document.select(".p-list-item__title-link[href]");
        titleLinks.stream()
                .map(this::toCollectedGacha)
                .flatMap(Optional::stream)
                .forEach(gacha -> collected.putIfAbsent(gacha.productCode(), gacha));
        return !titleLinks.isEmpty();
    }

    private Optional<CollectedGacha> toCollectedGacha(final Element titleLink) {
        Element card = titleLink.closest(".p-list-item");
        if (card == null) {
            return Optional.empty();
        }

        Element imageElement = card.selectFirst(".p-list-item__image-link img");
        if (imageElement == null) {
            return Optional.empty();
        }

        String href = titleLink.absUrl("href");
        String productCode = extractProductCode(card.text(), href);
        String imageUrl = imageElement.absUrl("src");
        if (productCode == null || imageUrl.isBlank()) {
            return Optional.empty();
        }

        return Optional.of(new CollectedGacha(
                source(),
                productCode,
                titleLink.text(),
                imageUrl,
                category
        ));
    }

    private String extractProductCode(final String cardText, final String href) {
        Matcher textMatcher = PRODUCT_CODE_TEXT_PATTERN.matcher(cardText);
        if (textMatcher.find()) {
            return textMatcher.group(1);
        }

        Matcher urlMatcher = PRODUCT_CODE_URL_PATTERN.matcher(href);
        if (urlMatcher.find()) {
            return urlMatcher.group(1);
        }
        return null;
    }

    private String nextPageUrl(final Document document, final int nextPage) {
        Element nextLink = document.selectFirst("a[href*='next_page=" + nextPage + "']");
        if (nextLink == null || nextLink.absUrl("href").isBlank()) {
            return null;
        }
        return nextLink.absUrl("href");
    }
}
