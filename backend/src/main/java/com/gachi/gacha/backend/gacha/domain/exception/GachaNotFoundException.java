package com.gachi.gacha.backend.gacha.domain.exception;


import com.gachi.gacha.backend.common.exception.EntityNotFoundException;
import com.gachi.gacha.backend.common.exception.ErrorCode;

public class GachaNotFoundException extends EntityNotFoundException {
    public GachaNotFoundException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
