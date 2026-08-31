package com.gachi.gacha.backend.store.application.dto;

import com.gachi.gacha.backend.store.domain.Store;
import com.gachi.gacha.backend.store.domain.StoreDetail;
import java.time.LocalDateTime;

public record StoreUpdateResult(
        Long storeId,
        LocalDateTime updatedAt
) {

    public static StoreUpdateResult of(final Store store, final StoreDetail storeDetail) {
        return new StoreUpdateResult(store.getId(), getUpdatedAt(store, storeDetail));
    }

    private static LocalDateTime getUpdatedAt(final Store store, final StoreDetail storeDetail) {
        LocalDateTime storeUpdatedAt = store.getUpdatedAt();
        LocalDateTime detailUpdatedAt = storeDetail.getUpdatedAt();

        if (storeUpdatedAt == null) {
            return detailUpdatedAt;
        }
        if (detailUpdatedAt == null || storeUpdatedAt.isAfter(detailUpdatedAt)) {
            return storeUpdatedAt;
        }
        return detailUpdatedAt;
    }
}
