package com.gachi.gacha.backend.gacha.domain.exception;


import com.gachi.gacha.backend.common.exception.EntityNotFoundException;
import com.gachi.gacha.backend.common.exception.ErrorCode;

public class GachaImageNotFoundException extends EntityNotFoundException {

    public GachaImageNotFoundException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
