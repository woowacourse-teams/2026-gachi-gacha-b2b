package com.gachi.gacha.backend.gacha.domain.exception;

import com.gachi.gacha.backend.common.exception.EntityNotFoundException;
import com.gachi.gacha.backend.common.exception.ErrorCode;

public class CategoryNotFoundException extends EntityNotFoundException {

    public CategoryNotFoundException() {
        super(ErrorCode.CATEGORY_NOT_FOUND);
    }
}
