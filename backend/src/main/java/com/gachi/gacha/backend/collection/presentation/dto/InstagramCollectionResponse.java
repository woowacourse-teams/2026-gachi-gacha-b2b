package com.gachi.gacha.backend.collection.presentation.dto;

public record InstagramCollectionResponse(int collectedCount) {

    public static InstagramCollectionResponse from(final int collectedCount) {
        return new InstagramCollectionResponse(collectedCount);
    }
}
