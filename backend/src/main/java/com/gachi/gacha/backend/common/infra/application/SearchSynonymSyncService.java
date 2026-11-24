package com.gachi.gacha.backend.common.infra.application;

import co.elastic.clients.elasticsearch.ElasticsearchClient;
import com.gachi.gacha.backend.common.infra.domain.SearchSynonym;
import com.gachi.gacha.backend.common.infra.domain.SearchSynonymJpaRepository;
import java.io.IOException;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class SearchSynonymSyncService {

    private final ElasticsearchClient esClient;
    private final SearchSynonymJpaRepository searchSynonymJpaRepository;

    // Serialize reads and writes so concurrent events on this instance cannot apply a stale rule last.
    public synchronized void syncRule(String synonymSet, String ruleKey) throws IOException {
        Optional<SearchSynonym> rule = searchSynonymJpaRepository.findBySynonymSetAndRuleKey(synonymSet, ruleKey);
        if (rule.isEmpty()) {
            log.warn("동의어 규칙 없음, 동기화 생략 set={}, ruleKey={}", synonymSet, ruleKey);
            return;
        }

        String synonyms = rule.get().getSynonyms();
        esClient.synonyms().putSynonymRule(p -> p
                .setId(synonymSet)
                .ruleId(ruleKey)
                .synonyms(synonyms));
    }
}
