package com.gachi.gacha.backend.collection.infra.ip4;

import static com.gachi.gacha.backend.common.exception.ErrorCode.COLLECTION_ITEM_PARSE_ERROR;
import static com.gachi.gacha.backend.common.exception.ErrorCode.INVALID_COLLECTION_CONFIGURATION;

import com.gachi.gacha.backend.collection.domain.CollectedGacha;
import com.gachi.gacha.backend.collection.domain.CollectionSource;
import com.gachi.gacha.backend.collection.domain.GachaCollector;
import com.gachi.gacha.backend.collection.domain.GachaCollectionException;
import com.gachi.gacha.backend.collection.infra.HtmlFetcher;
import jakarta.annotation.PostConstruct;
import java.time.Clock;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class Ip4GachaCollector implements GachaCollector {

    private static final Logger log = LoggerFactory.getLogger(Ip4GachaCollector.class);
    private static final Pattern POST_ID_PATTERN = Pattern.compile("[?&]p=(\\d+)");
    private static final DateTimeFormatter SEARCH_DATE_FORMATTER = DateTimeFormatter.ofPattern("uuuuMM");

    private final HtmlFetcher htmlFetcher;
    @Value("${collection.sources.ip4.list-url-template}")
    private String listUrlTemplate;

    @Value("${collection.sources.ip4.max-pages:100}")
    private int maxPages;

    @Value("${collection.sources.ip4.start-month-offset:0}")
    private int startMonthOffset;

    @Value("${collection.sources.ip4.collection-months:12}")
    private int collectionMonths;

    private final Clock clock;

    @PostConstruct
    private void validateConfiguration() {
        if (!listUrlTemplate.contains("%s")) {
            throw new GachaCollectionException(
                    INVALID_COLLECTION_CONFIGURATION,
                    "IP4 목록 URL 템플릿에 %s가 필요합니다."
            );
        }
        if (maxPages < 1 || startMonthOffset < 0 || collectionMonths < 1) {
            throw new GachaCollectionException(
                    INVALID_COLLECTION_CONFIGURATION,
                    "IP4 최대 페이지 수와 수집 개월 수는 1 이상이고 시작 월 간격은 0 이상이어야 합니다."
            );
        }
    }

    @Override
    public CollectionSource source() {
        return CollectionSource.IP4;
    }

    @Override
    public List<CollectedGacha> collect() {
        Map<String, CollectedGacha> collected = new LinkedHashMap<>();
        YearMonth currentMonth = YearMonth.now(clock);

        for (int monthOffset = 0; monthOffset < collectionMonths; monthOffset++) {
            YearMonth targetMonth = currentMonth.minusMonths(startMonthOffset + monthOffset);
            collectMonth(targetMonth, collected);
        }

        return new ArrayList<>(collected.values());
    }

    private void collectMonth(
            final YearMonth targetMonth,
            final Map<String, CollectedGacha> collected
    ) {
        Set<String> visitedUrls = new HashSet<>();
        String currentUrl = listUrl(targetMonth);

        for (int page = 1; page <= maxPages && visitedUrls.add(currentUrl); page++) {
            Document listDocument = Jsoup.parse(htmlFetcher.fetch(currentUrl), currentUrl);
            List<Element> items = listDocument.select("#cupsuletoy > ul > li");
            if (items.isEmpty()) {
                break;
            }

            collectItems(items, collected);

            String nextUrl = nextPageUrl(listDocument);
            if (nextUrl == null) {
                break;
            }
            currentUrl = nextUrl;
        }
    }

    private void collectItems(
            final List<Element> items,
            final Map<String, CollectedGacha> collected
    ) {
        for (Element item : items) {
            collectItem(item).ifPresent(gacha -> collected.putIfAbsent(gacha.productCode(), gacha));
        }
    }

    private Optional<CollectedGacha> collectItem(final Element item) {
        try {
            return toCollectedGacha(item);
        } catch (RuntimeException exception) {
            log.warn("IP4 상품 수집을 건너뜁니다. detailUrl={}", detailUrl(item), exception);
            return Optional.empty();
        }
    }

    private String listUrl(final YearMonth targetMonth) {
        return listUrlTemplate.formatted(targetMonth.format(SEARCH_DATE_FORMATTER));
    }

    private Optional<CollectedGacha> toCollectedGacha(final Element item) {
        Element linkElement = item.selectFirst(".image a[href*='/cupsuletoy/']");
        Element imageElement = item.selectFirst(".image img");
        Element detailElement = item.selectFirst("dl dd");
        if (linkElement == null || imageElement == null || detailElement == null) {
            return Optional.empty();
        }

        String detailUrl = linkElement.absUrl("href");
        String productCode = extractProductCode(detailUrl);
        String name = extractName(detailElement);
        String imageUrl = imageElement.absUrl("src");
        Element categoryElement = detailElement.selectFirst(".brand");
        String category = categoryElement == null ? null : categoryElement.text();
        if (name.isBlank() || imageUrl.isBlank()) {
            return Optional.empty();
        }

        return Optional.of(new CollectedGacha(
                source(),
                productCode,
                name,
                imageUrl,
                category
        ));
    }

    private String extractProductCode(final String detailUrl) {
        Document detailDocument = Jsoup.parse(htmlFetcher.fetch(detailUrl), detailUrl);
        Element shortLink = detailDocument.selectFirst("link[rel=shortlink]");
        if (shortLink == null) {
            throw new GachaCollectionException(
                    COLLECTION_ITEM_PARSE_ERROR,
                    "IP4 shortlink를 찾을 수 없습니다. url=" + detailUrl
            );
        }

        Matcher matcher = POST_ID_PATTERN.matcher(shortLink.attr("href"));
        if (!matcher.find()) {
            throw new GachaCollectionException(
                    COLLECTION_ITEM_PARSE_ERROR,
                    "IP4 게시물 ID를 찾을 수 없습니다. url=" + detailUrl
            );
        }
        return matcher.group(1);
    }

    private String extractName(final Element detailElement) {
        Element copied = detailElement.clone();
        copied.select(".brand, .copy").remove();
        return copied.text();
    }

    private String detailUrl(final Element item) {
        Element linkElement = item.selectFirst(".image a[href]");
        if (linkElement == null) {
            return "unknown";
        }
        return linkElement.absUrl("href");
    }

    private String nextPageUrl(final Document document) {
        Element nextLink = document.selectFirst("a.next.page-numbers[href], a[rel=next][href]");
        if (nextLink == null || nextLink.absUrl("href").isBlank()) {
            return null;
        }
        return nextLink.absUrl("href");
    }
}
