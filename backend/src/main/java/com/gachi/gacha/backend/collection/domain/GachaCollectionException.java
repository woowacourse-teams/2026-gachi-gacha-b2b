package com.gachi.gacha.backend.collection.domain;

import com.gachi.gacha.backend.common.exception.BusinessException;
import com.gachi.gacha.backend.common.exception.ErrorCode;

public class GachaCollectionException extends BusinessException {

    public GachaCollectionException(final ErrorCode errorCode) {
        super(errorCode);
    }

    public GachaCollectionException(final ErrorCode errorCode, final String detailMessage) {
        super(errorCode, detailMessage);
    }

    public GachaCollectionException(
            final ErrorCode errorCode,
            final String detailMessage,
            final Throwable cause
    ) {
        super(errorCode, detailMessage, cause);
    }
}
