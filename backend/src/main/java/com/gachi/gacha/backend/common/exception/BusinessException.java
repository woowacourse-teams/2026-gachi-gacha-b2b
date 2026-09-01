package com.gachi.gacha.backend.common.exception;

import lombok.Getter;

@Getter
public class BusinessException extends RuntimeException {

    private final ErrorCode errorCode;

    public BusinessException(final ErrorCode errorCode) {
        super(errorCode.getMessage());
        this.errorCode = errorCode;
    }

    protected BusinessException(final ErrorCode errorCode, final String detailMessage) {
        super(detailMessage);
        this.errorCode = errorCode;
    }

    protected BusinessException(
            final ErrorCode errorCode,
            final String detailMessage,
            final Throwable cause
    ) {
        super(detailMessage, cause);
        this.errorCode = errorCode;
    }
}
