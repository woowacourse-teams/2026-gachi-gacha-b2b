package com.gachi.gacha.backend.gacha.domain.exception;

import com.gachi.gacha.backend.common.exception.BusinessException;
import com.gachi.gacha.backend.common.exception.ErrorCode;

public class CategoryAlreadyExistsException extends BusinessException {

    public CategoryAlreadyExistsException() {
        super(ErrorCode.CATEGORY_ALREADY_EXISTS);
    }
}
