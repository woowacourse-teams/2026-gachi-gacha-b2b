package com.gachi.gacha.backend.collection.domain;

import static com.gachi.gacha.backend.common.exception.ErrorCode.INVALID_COLLECTED_GACHA;

public record CollectedGacha(
        CollectionSource source,
        String productCode,
        String name,
        String imageUrl,
        String category
) {

    public CollectedGacha {
        if (source == null || !source.isCollectable()) {
            throw new GachaCollectionException(INVALID_COLLECTED_GACHA, "수집 가능한 출처가 필요합니다.");
        }
        if (productCode == null || productCode.isBlank()) {
            throw new GachaCollectionException(INVALID_COLLECTED_GACHA, "상품 코드가 필요합니다.");
        }
        if (name == null || name.isBlank()) {
            throw new GachaCollectionException(INVALID_COLLECTED_GACHA, "상품명이 필요합니다.");
        }
        if (imageUrl == null || imageUrl.isBlank()) {
            throw new GachaCollectionException(INVALID_COLLECTED_GACHA, "이미지 URL이 필요합니다.");
        }

        productCode = productCode.trim();
        name = name.trim();
        imageUrl = imageUrl.trim();
        category = normalizeNullable(category);
    }

    private static String normalizeNullable(final String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
