package com.gachi.gacha.backend.common.infra.presentation.dto;

import com.gachi.gacha.backend.common.infra.application.dto.SearchSynonymCommand;

public record SearchSynonymRequest(
        String synonymSet,
        String ruleKey,
        String synonyms
) {
    public SearchSynonymCommand toCommand() {
        return SearchSynonymCommand.builder()
                .synonymSet(synonymSet)
                .ruleKey(ruleKey)
                .synonyms(synonyms)
                .build();
    }
}
