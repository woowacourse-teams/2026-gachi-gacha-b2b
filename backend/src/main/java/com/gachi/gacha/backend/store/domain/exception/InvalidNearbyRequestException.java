package com.gachi.gacha.backend.store.domain.exception;


import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.common.exception.InvalidValueException;

public class InvalidNearbyRequestException extends InvalidValueException {
    public InvalidNearbyRequestException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
