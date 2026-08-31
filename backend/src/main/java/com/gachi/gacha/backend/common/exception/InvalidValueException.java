package com.gachi.gacha.backend.common.exception;

public class InvalidValueException extends BusinessException {
    public InvalidValueException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
