package com.gachi.gacha.backend.store.domain.exception;


import com.gachi.gacha.backend.common.exception.EntityNotFoundException;
import com.gachi.gacha.backend.common.exception.ErrorCode;

public class StoreImageNotFoundException extends EntityNotFoundException {

    public StoreImageNotFoundException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
