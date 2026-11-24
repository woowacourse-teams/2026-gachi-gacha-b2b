package com.gachi.gacha.backend.common.infra.application.dto;

import com.gachi.gacha.backend.common.infra.domain.SearchSynonym;
import lombok.Builder;

@Builder
public record SearchSynonymInfo(
        String synonymSet,
        String ruleKey,
        String synonyms
) {
    public static SearchSynonymInfo from(SearchSynonym s) {
        return SearchSynonymInfo.builder()
                .synonymSet(s.getSynonymSet())
                .ruleKey(s.getRuleKey())
                .synonyms(s.getSynonyms())
                .build();
    }
}
