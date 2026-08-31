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
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class AmuzuGachaCollector implements GachaCollector {

    private static final Pattern PRODUCT_CODE_TEXT_PATTERN = Pattern.compile("商品コード[：:]\\s*([A-Za-z0-9_-]+)");
    private static final Pattern PRODUCT_CODE_URL_PATTERN = Pattern.compile("/([A-Za-z][A-Za-z0-9_-]*)\\.html(?:[?#]|$)");

    private final HtmlFetcher htmlFetcher;
    private final String listUrl;
    private final String category;
    private final int maxPages;

    public AmuzuGachaCollector(
            final HtmlFetcher htmlFetcher,
            @Value("${collection.sources.amuzu.list-url}") final String listUrl,
            @Value("${collection.sources.amuzu.category:CAPSULE_TOY_006}") final String category,
            @Value("${collection.sources.amuzu.max-pages:100}") final int maxPages
    ) {
        this.htmlFetcher = htmlFetcher;
        this.listUrl = listUrl;
        this.category = category;
        this.maxPages = maxPages;
    }

    @Override
    public CollectionSource source() {
        return CollectionSource.A_MUZU;
    }

    @Override
    public List<CollectedGacha> collect() {
        final Map<String, CollectedGacha> collected = new LinkedHashMap<>();
        final Set<String> visitedUrls = new HashSet<>();
        String currentUrl = listUrl;

        for (int page = 1; page <= maxPages && visitedUrls.add(currentUrl); page++) {
            final Document document = Jsoup.parse(htmlFetcher.fetch(currentUrl), currentUrl);
            final List<Element> titleLinks = document.select(".p-list-item__title-link[href]");
            if (titleLinks.isEmpty()) {
                break;
            }

            for (final Element titleLink : titleLinks) {
                toCollectedGacha(titleLink).ifPresent(gacha -> collected.putIfAbsent(gacha.productCode(), gacha));
            }

            final String nextUrl = nextPageUrl(document, page + 1);
            if (nextUrl == null) {
                break;
            }
            currentUrl = nextUrl;
        }

        return new ArrayList<>(collected.values());
    }

    private Optional<CollectedGacha> toCollectedGacha(final Element titleLink) {
        final Element card = titleLink.closest(".p-list-item");
        if (card == null) {
            return Optional.empty();
        }

        final Element imageElement = card.selectFirst(".p-list-item__image-link img");
        if (imageElement == null) {
            return Optional.empty();
        }

        final String href = titleLink.absUrl("href");
        final String productCode = extractProductCode(card.text(), href);
        final String imageUrl = imageElement.absUrl("src");
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
        final Matcher textMatcher = PRODUCT_CODE_TEXT_PATTERN.matcher(cardText);
        if (textMatcher.find()) {
            return textMatcher.group(1);
        }

        final Matcher urlMatcher = PRODUCT_CODE_URL_PATTERN.matcher(href);
        if (urlMatcher.find()) {
            return urlMatcher.group(1);
        }
        return null;
    }

    private String nextPageUrl(final Document document, final int nextPage) {
        final Element nextLink = document.selectFirst("a[href*='next_page=" + nextPage + "']");
        if (nextLink == null || nextLink.absUrl("href").isBlank()) {
            return null;
        }
        return nextLink.absUrl("href");
    }
}
