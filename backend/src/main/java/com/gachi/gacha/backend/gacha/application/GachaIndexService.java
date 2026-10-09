package com.gachi.gacha.backend.gacha.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.core.BulkRequest;
import co.elastic.clients.elasticsearch.core.BulkResponse;
import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.gacha.application.dto.GachaDocument;
import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.gacha.domain.GachaJpaRepository;
import com.gachi.gacha.backend.gacha.domain.exception.GachaIndexingException;
import com.gachi.gacha.backend.store.domain.Store;
import com.gachi.gacha.backend.usecase.domain.StoreGacha;
import com.gachi.gacha.backend.usecase.domain.StoreGachaJpaRepository;
import java.io.IOException;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class GachaIndexService {

    private final ElasticsearchClient esClient;
    private final GachaJpaRepository gachaJpaRepository;
    private final StoreGachaJpaRepository storeGachaJpaRepository;

    @Value("${elasticsearch.index}")
    private String INDEX;

    @Transactional(readOnly = true)
    public void indexAll(final List<Long> gachaIds) throws IOException {
        if(gachaIds.isEmpty()) {
            return;
        }
        List<Gacha> gachas = gachaJpaRepository.findByIdsWithCategories(gachaIds);
        Map<Long, List<Store>> storesByGacha = storeGachaJpaRepository
                .findAllWithStoreByGachaIdIn(gachaIds).stream()
                .collect(Collectors.groupingBy(
                        sg -> sg.getGacha().getId(),
                        Collectors.mapping(StoreGacha::getStore, Collectors.toList())));

        BulkRequest.Builder br = new BulkRequest.Builder();
        Set<Long> found = new HashSet<>();

        for (Gacha g : gachas) {
            found.add(g.getId());
            GachaDocument doc = GachaDocument.of(g, storesByGacha.getOrDefault(g.getId(), List.of()));
            br.operations(op -> op.index(i -> i.index(INDEX).id(String.valueOf(g.getId())).document(doc)));
        }
        for (Long id : gachaIds) {
            if (!found.contains(id)) {
                br.operations(op -> op.delete(d -> d.index(INDEX).id(String.valueOf(id))));
            }
        }

        BulkResponse res = esClient.bulk(br.build());
        if (res.errors()) {
            List<String> failed = res.items().stream()
                    .filter(i -> i.error() != null)
                    .map(i -> i.id() + ":" + i.error().reason())
                    .toList();
            throw new GachaIndexingException(ErrorCode.ELASTICSEARCH_INDEX_FAILED, "ES bulk 색인 실패 count=" + failed.size() + " " + abbreviate(failed));
        }
    }

    public void reindexAll() throws IOException {
        int page = 0;
        Page<Long> ids;
        do {
            ids = gachaJpaRepository.findGachaIds(PageRequest.of(page++, 500, Sort.by("id")));
            indexAll(ids.getContent());
        } while (ids.hasNext());
    }

    private String abbreviate(final List<String> failed) {
        return failed.stream().limit(5).collect(Collectors.joining(", "))
                + (failed.size() > 5 ? " ..." : "");
    }
}
