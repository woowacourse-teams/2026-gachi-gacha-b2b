package com.gachi.gacha.backend.common.infra.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import co.elastic.clients.elasticsearch.synonyms.SynonymRule;
import com.gachi.gacha.backend.common.infra.domain.SearchSynonymJpaRepository;
import java.io.IOException;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchSynonymSyncService {

    private final ElasticsearchClient esClient;
    private final SearchSynonymJpaRepository searchSynonymJpaRepository;

    @Transactional(readOnly = true)
    public void syncAll(String synonymSet) throws IOException {
        List<SynonymRule> rules = searchSynonymJpaRepository.findAllBySynonymSet(synonymSet)
                .stream()
                .map(s -> SynonymRule.of(r -> r.id(s.getRuleKey()).synonyms(s.getSynonyms())))
                .toList();
        if (rules.isEmpty()) {
            log.warn("동의어 규칙 없음, 동기화 생략 set={}", synonymSet);
            return;
        }
        esClient.synonyms().putSynonym(p -> p
                .id(synonymSet)
                .synonymsSet(rules));
    }
}
