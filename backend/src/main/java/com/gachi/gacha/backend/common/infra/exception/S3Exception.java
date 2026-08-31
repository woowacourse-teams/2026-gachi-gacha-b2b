package com.gachi.gacha.backend.common.infra.exception;

import com.gachi.gacha.backend.common.exception.ErrorCode;
import com.gachi.gacha.backend.common.exception.ExternalApiException;

public class S3Exception extends ExternalApiException {
    public S3Exception(ErrorCode errorCode) {
        super(errorCode);
    }
}
