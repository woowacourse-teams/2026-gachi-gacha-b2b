package com.gachi.gacha.backend.gacha.domain.exception;


import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.common.exception.InvalidValueException;

public class GachaImageInvalidValueException extends InvalidValueException {
    public GachaImageInvalidValueException(final ErrorCode errorCode) {
        super(errorCode);
    }
}
