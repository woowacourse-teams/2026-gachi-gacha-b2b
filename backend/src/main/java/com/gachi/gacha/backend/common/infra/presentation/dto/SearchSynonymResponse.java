package com.gachi.gacha.backend.common.infra.presentation.dto;

import com.gachi.gacha.backend.common.infra.application.dto.SearchSynonymInfo;
import lombok.Builder;

@Builder
public record SearchSynonymResponse(
        String synonymSet,
        String ruleKey,
        String synonyms
) {
    public static SearchSynonymResponse from(SearchSynonymInfo info) {
        return SearchSynonymResponse.builder()
                .synonymSet(info.synonymSet())
                .ruleKey(info.ruleKey())
                .synonyms(info.synonyms())
                .build();
    }
}
