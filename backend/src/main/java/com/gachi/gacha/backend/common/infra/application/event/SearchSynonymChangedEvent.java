package com.gachi.gacha.backend.common.infra.application.event;

public record SearchSynonymChangedEvent(
        String synonymSet
) {
}
