package com.gachi.gacha.backend.common.infra.application.dto;

import com.gachi.gacha.backend.common.infra.domain.SearchSynonym;
import lombok.Builder;

@Builder
public record SearchSynonymCommand(
        String synonymSet,
        String ruleKey,
        String synonyms
) {
    public SearchSynonym toEntity() {
        return SearchSynonym.builder()
                .synonymSet(synonymSet)
                .ruleKey(ruleKey)
                .synonyms(synonyms)
                .build();
    }
}
