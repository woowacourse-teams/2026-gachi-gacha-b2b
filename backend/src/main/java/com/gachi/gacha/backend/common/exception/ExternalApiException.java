package com.gachi.gacha.backend.common.exception;

public class ExternalApiException extends BusinessException {
    public ExternalApiException(final ErrorCode errorCode) {
        super(errorCode);
    }

    public ExternalApiException(final ErrorCode errorCode, final String detailMessage) {
        super(errorCode, detailMessage);
    }
}
