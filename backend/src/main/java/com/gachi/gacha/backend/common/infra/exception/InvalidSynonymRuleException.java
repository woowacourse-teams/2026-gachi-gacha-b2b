package com.gachi.gacha.backend.common.infra.exception;

import com.gachi.gacha.backend.common.exception.BusinessException;
import com.gachi.gacha.backend.common.exception.ErrorCode;

public class InvalidSynonymRuleException extends BusinessException {

    public InvalidSynonymRuleException(String reason) {
        super(ErrorCode.INVALID_INPUT_VALUE, reason);
    }
}
