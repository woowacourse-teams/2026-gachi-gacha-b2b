package com.gachi.gacha.backend.common.infra.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SearchSynonymJpaRepository extends JpaRepository<SearchSynonym, Long> {
    List<SearchSynonym> findAllBySynonymSet(String synonymSet);

    Optional<SearchSynonym> findBySynonymSetAndRuleKey(String synonymSet, String ruleKey);
}
