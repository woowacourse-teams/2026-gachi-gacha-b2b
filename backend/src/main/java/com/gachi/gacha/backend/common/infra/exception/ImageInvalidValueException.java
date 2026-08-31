package com.gachi.gacha.backend.common.infra.exception;


import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.common.exception.InvalidValueException;

public class ImageInvalidValueException extends InvalidValueException {
    public ImageInvalidValueException(ErrorCode errorCode) {
        super(errorCode);
    }
}
