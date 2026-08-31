package com.gachi.gacha.backend.collection.domain;

public class GachaCollectionException extends RuntimeException {

    public GachaCollectionException(final String message) {
        super(message);
    }

    public GachaCollectionException(final String message, final Throwable cause) {
        super(message, cause);
    }
}
