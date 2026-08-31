package com.gachi.gacha.backend.store.domain.exception;


import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.common.exception.InvalidValueException;

public class StoreImageInvalidValueException extends InvalidValueException {
    public StoreImageInvalidValueException(ErrorCode errorCode) {
        super(errorCode);
    }
}
