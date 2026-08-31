package com.gachi.gacha.backend.store.domain.exception;


import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.common.exception.InvalidValueException;

public class InvalidStoreException extends InvalidValueException {

    public InvalidStoreException() {
        super(ErrorCode.INVALID_STORE_POLICY);
    }
}
