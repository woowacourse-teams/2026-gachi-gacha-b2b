package com.gachi.gacha.backend.usecase.application.dto;

import com.gachi.gacha.backend.gacha.domain.Gacha;
import com.gachi.gacha.backend.store.domain.Store;
import lombok.Builder;

@Builder
public record StoreGachaCreatCommand(
        Store store,
        Gacha gacha
) {
    public static StoreGachaCreatCommand fromCommand(final Store store, final Gacha gacha) {
        return StoreGachaCreatCommand.builder()
                .store(store)
                .gacha(gacha)
                .build();
    }
}
