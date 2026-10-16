package com.gachi.gacha.backend.usecase.domain.exception;

import com.gachi.gacha.backend.common.exception.EntityNotFoundException;
import com.gachi.gacha.backend.common.exception.ErrorCode;

public class StoreGachaNotFoundException extends EntityNotFoundException {
  public StoreGachaNotFoundException(final ErrorCode errorCode) {
    super(errorCode);
  }
}
