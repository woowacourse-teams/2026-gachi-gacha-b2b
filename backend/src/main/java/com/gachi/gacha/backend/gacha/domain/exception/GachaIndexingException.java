package com.gachi.gacha.backend.gacha.domain.exception;

import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.common.exception.ExternalApiException;

public class GachaIndexingException extends ExternalApiException {
    public GachaIndexingException(final ErrorCode errorCode, final String detailMessage) {
        super(errorCode, detailMessage);
    }
}
