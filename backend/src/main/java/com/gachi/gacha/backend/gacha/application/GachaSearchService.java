package com.gachi.gacha.backend.gacha.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch._types.FieldValue;
import co.elastic.clients.elasticsearch._types.SortOrder;
import co.elastic.clients.elasticsearch._types.query_dsl.BoolQuery;
import co.elastic.clients.elasticsearch._types.query_dsl.Operator;
import co.elastic.clients.elasticsearch._types.query_dsl.Query;
import co.elastic.clients.elasticsearch.core.SearchResponse;
import co.elastic.clients.elasticsearch.core.search.Hit;
import com.gachi.gacha.backend.gacha.application.dto.GachaDocument;
import com.gachi.gacha.backend.gacha.application.dto.GachaSearchCondition;
import com.gachi.gacha.backend.gacha.presentation.dto.SearchResult;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class GachaSearchService {

    private final ElasticsearchClient esClient;

    @Value("${elasticsearch.index}")
    private String INDEX;

    public SearchResult<GachaDocument> search(final GachaSearchCondition c) throws IOException {
        SearchResponse<GachaDocument> res = esClient.search(s -> s
                .index(INDEX)
                .from(c.page() * c.size())
                .size(c.size() + 1)
                .query(buildQuery(c))
                .sort(so -> so.score(sc -> sc.order(SortOrder.Desc)))
                .sort(so -> so.field(f -> f.field("id").order(SortOrder.Desc))), // tie-breaker
                GachaDocument.class);
        return toSearchResult(c, res);
    }

    private Query buildQuery(final GachaSearchCondition c) {
        return Query.of(q -> q.bool(b -> {
            applyKeyword(c, b);
            applyCategoryFilter(c, b);
            applyGeoFilter(c, b);
            return b;
        }));
    }

    private void applyKeyword(final GachaSearchCondition c, final BoolQuery.Builder b) {
        if (!StringUtils.hasText(c.keyword())) {
            b.must(m -> m.matchAll(ma -> ma));
            return;
        }
        b.should(m -> m.multiMatch(mm -> mm
                .query(c.keyword())
                .fields("name^3", "categoryNames^2", "caption")
                .fuzziness("AUTO")));

        b.should(m -> m.multiMatch(mm -> mm
                .query(c.keyword())
                .fields("categoryNames^2")
                .analyzer("korean")
                .boost(0.5f)));

        b.should(m -> m.match(mt -> mt          // 부분 일치 (ngram)
                .field("name.ngram")
                .query(c.keyword())
                .operator(Operator.And)
                .boost(1.0f))
        );
        b.minimumShouldMatch("1");
    }

    private void applyCategoryFilter(final GachaSearchCondition c, final BoolQuery.Builder b) {
        if (c.categoryIds() == null || c.categoryIds().isEmpty()) {
            return;
        }
        b.filter(f -> f.terms(t -> t
                .field("categoryIds")
                .terms(tv -> tv.value(c.categoryIds().stream()
                        .map(FieldValue::of).toList()))));
    }

    private void applyGeoFilter(final GachaSearchCondition c, final BoolQuery.Builder b) {
        if (c.lat() == null || c.lon() == null) {
            return;
        }
        double km = c.distanceKm() != null ? c.distanceKm() : 3.0;
        b.filter(f -> f.geoDistance(g -> g
                .field("locations")
                .distance(km + "km")
                .location(l -> l.latlon(ll -> ll.lat(c.lat()).lon(c.lon())))));
    }

    private SearchResult<GachaDocument> toSearchResult(
            final GachaSearchCondition c,
            final SearchResponse<GachaDocument> res
    ) {
        List<GachaDocument> hits = res.hits().hits()
                .stream()
                .map(Hit::source)
                .toList();
        boolean hasNext = hits.size() > c.size();
        List<GachaDocument> content = hasNext ? hits.subList(0, c.size()) : hits;
        return new SearchResult<>(content, c.page(), c.size(), hasNext);
    }
}
