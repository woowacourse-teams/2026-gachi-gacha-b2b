package com.gachi.gacha.backend.common.infra.application;

import com.gachi.gacha.backend.common.infra.application.dto.SearchSynonymCommand;
import com.gachi.gacha.backend.common.infra.application.dto.SearchSynonymInfo;
import com.gachi.gacha.backend.common.infra.application.event.SearchSynonymChangedEvent;
import com.gachi.gacha.backend.common.infra.domain.SearchSynonym;
import com.gachi.gacha.backend.common.infra.domain.SearchSynonymJpaRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class SearchSynonymService {

    private final ApplicationEventPublisher publisher;
    private final SearchSynonymJpaRepository searchSynonymJpaRepository;

    @Transactional
    public void addSearchSynonym(SearchSynonymCommand searchSynonymCommand) {
        searchSynonymJpaRepository.findBySynonymSetAndRuleKey(searchSynonymCommand.synonymSet(), searchSynonymCommand.ruleKey())
                .ifPresentOrElse(
                        existing -> existing.updateSynonyms(searchSynonymCommand.synonyms()),
                        () -> searchSynonymJpaRepository.save(searchSynonymCommand.toEntity()));

        publisher.publishEvent(new SearchSynonymChangedEvent(searchSynonymCommand.synonymSet()));
    }

    public List<SearchSynonymInfo> findAllBySynonymSet(String synonymSet) {
        List<SearchSynonym> synonyms = searchSynonymJpaRepository.findAllBySynonymSet(synonymSet);
        return synonyms.stream().map(SearchSynonymInfo::from).toList();
    }
}
