package com.gachi.gacha.backend.store.application.dto;

import com.gachi.gacha.backend.store.domain.Store;
import java.time.LocalDateTime;

public record StoreCreateResult(
        Long storeId,
        LocalDateTime createdAt
) {

    public static StoreCreateResult from(final Store store) {
        return new StoreCreateResult(store.getId(), store.getCreatedAt());
    }
}
