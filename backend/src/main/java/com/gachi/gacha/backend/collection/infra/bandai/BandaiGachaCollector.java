package com.gachi.gacha.backend.collection.infra.bandai;

import static com.gachi.gacha.backend.common.exception.ErrorCode.INVALID_COLLECTION_CONFIGURATION;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.domain.GachaCollector;
import com.gachi.gacha.backend.collection.domain.GachaCollectionException;
import com.gachi.gacha.backend.collection.infra.HtmlFetcher;
import jakarta.annotation.PostConstruct;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
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
public class BandaiGachaCollector implements GachaCollector {

    private static final Pattern PRODUCT_CODE_PATTERN = Pattern.compile("[?&]product_code=([^&#]+)");
    private static final Pattern PAGE_NUMBER_PATTERN = Pattern.compile("([?&]pageNo=)\\d+");

    private final HtmlFetcher htmlFetcher;
    @Value("${collection.sources.bandai.list-url}")
    private final String listUrl;
    @Value("${collection.sources.bandai.start-page:1}")
    private final int startPage;
    @Value("${collection.sources.bandai.max-pages:100}")
    private final int maxPages;

    @PostConstruct
    private void validateConfiguration() {
        if (startPage < 1 || maxPages < 1) {
            throw new GachaCollectionException(
                    INVALID_COLLECTION_CONFIGURATION,
                    "Bandai 시작 페이지와 최대 페이지 수는 1 이상이어야 합니다."
            );
        }
    }

    @Override
    public CollectionSource source() {
        return CollectionSource.BANDAI;
    }

    @Override
    public List<CollectedGacha> collect() {
        Map<String, CollectedGacha> collected = new LinkedHashMap<>();

        for (int pageOffset = 0; pageOffset < maxPages; pageOffset++) {
            int page = startPage + pageOffset;
            String pageUrl = pageUrl(page);
            Document document = Jsoup.parse(htmlFetcher.fetch(pageUrl), pageUrl);
            List<Element> productLinks = document.select(
                    ".wm-column-item a[href*='item_details.html'][href*='product_code=']"
            );
            if (productLinks.isEmpty()) {
                break;
            }

            for (Element productLink : productLinks) {
                toCollectedGacha(productLink).ifPresent(gacha -> collected.putIfAbsent(gacha.productCode(), gacha));
            }

            if (!hasNextPage(document, page + 1)) {
                break;
            }
        }

        return new ArrayList<>(collected.values());
    }

    private java.util.Optional<CollectedGacha> toCollectedGacha(final Element productLink) {
        String href = productLink.absUrl("href");
        Matcher matcher = PRODUCT_CODE_PATTERN.matcher(href);
        Element nameElement = productLink.selectFirst("p:not(.itemList_price)");
        Element imageElement = productLink.selectFirst("img");
        if (!matcher.find() || nameElement == null || imageElement == null) {
            return java.util.Optional.empty();
        }

        String productCode = URLDecoder.decode(matcher.group(1), StandardCharsets.UTF_8);
        String imageUrl = imageElement.absUrl("src");
        if (imageUrl.isBlank()) {
            return java.util.Optional.empty();
        }

        return Optional.of(new CollectedGacha(
                source(),
                productCode,
                nameElement.text(),
                imageUrl,
                null
        ));
    }

    private boolean hasNextPage(final Document document, final int nextPage) {
        return document.select("a[href*='pageNo=" + nextPage + "']").stream()
                .anyMatch(element -> !element.absUrl("href").isBlank());
    }

    private String pageUrl(final int page) {
        Matcher matcher = PAGE_NUMBER_PATTERN.matcher(listUrl);
        if (matcher.find()) {
            return matcher.replaceFirst(Matcher.quoteReplacement(matcher.group(1) + page));
        }
        String separator = listUrl.contains("?") ? "&" : "?";
        return listUrl + separator + "pageNo=" + page;
    }
}
