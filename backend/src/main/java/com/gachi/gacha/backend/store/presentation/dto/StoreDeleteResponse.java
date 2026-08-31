package com.gachi.gacha.backend.store.presentation.dto;


import com.gachi.gacha.backend.store.application.dto.StoreDeleteResult;

public record StoreDeleteResponse(
        Long storeId
) {

    public static StoreDeleteResponse from(final StoreDeleteResult result) {
        return new StoreDeleteResponse(result.storeId());
    }
}
