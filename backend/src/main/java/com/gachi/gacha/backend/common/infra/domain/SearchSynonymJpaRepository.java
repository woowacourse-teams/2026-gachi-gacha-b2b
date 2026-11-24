package com.gachi.gacha.backend.common.infra.domain;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;

public interface SearchSynonymJpaRepository extends JpaRepository<SearchSynonym, Long> {
    List<SearchSynonym> findAllBySynonymSet(String synonymSet);

    Optional<SearchSynonym> findBySynonymSetAndRuleKey(String synonymSet, String ruleKey);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    Optional<SearchSynonym> findForUpdateBySynonymSetAndRuleKey(String synonymSet, String ruleKey);
}
