package com.gachi.gacha.backend.store.domain.exception;


import com.gachi.gacha.backend.common.exception.EntityNotFoundException;
import com.gachi.gacha.backend.common.exception.ErrorCode;

public class StoreNotFoundException extends EntityNotFoundException {

    public StoreNotFoundException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
