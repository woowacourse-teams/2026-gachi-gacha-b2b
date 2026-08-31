package com.gachi.gacha.backend.store.application.dto;

import com.gachi.gacha.backend.store.domain.StoreImage;
import lombok.Builder;

@Builder
public record StoreImageInfo(
        Long storeImageId,
        String imageUrl
) {
    public static StoreImageInfo from(final StoreImage storeImage) {
        return StoreImageInfo.builder()
                .storeImageId(storeImage.getId())
                .imageUrl(storeImage.getImageUrl())
                .build();
    }
}
