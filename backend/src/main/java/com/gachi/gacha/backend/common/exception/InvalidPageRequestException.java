package com.gachi.gacha.backend.common.exception;

public class InvalidPageRequestException extends InvalidValueException {
    public InvalidPageRequestException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
