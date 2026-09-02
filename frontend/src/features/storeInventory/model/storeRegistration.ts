export const STORE_TEXT_MAX_LENGTH = 255;

export interface StoreRegistrationDraft {
  name: string;
  thumbnailUrl: string;
  latitude: string;
  longitude: string;
  phoneNumber: string;
  instagramId: string;
  address: string;
  floor: string;
  unit: string;
  businessHours: string;
  paymentMethods: string;
  gachaMachineAmount: string;
  coinPrice: string;
  gachaPriceMin: string;
  gachaPriceMax: string;
  kujiAmount: string;
  kujiPriceMin: string;
  kujiPriceMax: string;
  hasSelectGacha: boolean;
  selectGachaPriceMin: string;
  selectGachaPriceMax: string;
  facilities: string;
  hasRandomBox: boolean;
}

export interface StoreRegistration {
  name: string;
  thumbnailUrl: string | null;
  latitude: number;
  longitude: number;
  phoneNumber: string | null;
  instagramId: string | null;
  address: string;
  floor: number | null;
  unit: string | null;
  businessHours: string | null;
  paymentMethods: string | null;
  gachaMachineAmount: number | null;
  coinPrice: number | null;
  gachaPriceMin: number | null;
  gachaPriceMax: number | null;
  kujiAmount: number | null;
  kujiPriceMin: number | null;
  kujiPriceMax: number | null;
  hasSelectGacha: boolean;
  selectGachaPriceMin: number | null;
  selectGachaPriceMax: number | null;
  facilities: string[];
  hasRandomBox: boolean;
}

export type StoreRegistrationErrors = Partial<
  Record<keyof StoreRegistrationDraft, string>
>;

export type StoreRegistrationValidation =
  | { isValid: true; value: StoreRegistration }
  | { isValid: false; errors: StoreRegistrationErrors };

export const EMPTY_STORE_REGISTRATION_DRAFT: StoreRegistrationDraft = {
  name: '',
  thumbnailUrl: '',
  latitude: '',
  longitude: '',
  phoneNumber: '',
  instagramId: '',
  address: '',
  floor: '',
  unit: '',
  businessHours: '',
  paymentMethods: '',
  gachaMachineAmount: '',
  coinPrice: '',
  gachaPriceMin: '',
  gachaPriceMax: '',
  kujiAmount: '',
  kujiPriceMin: '',
  kujiPriceMax: '',
  hasSelectGacha: false,
  selectGachaPriceMin: '',
  selectGachaPriceMax: '',
  facilities: '',
  hasRandomBox: false,
};

const trimOrNull = (value: string) => value.trim() || null;

const parseRequiredCoordinate = (
  value: string,
  label: string,
  min: number,
  max: number,
): { value: number; error?: string } => {
  if (!value.trim())
    return { value: Number.NaN, error: `${label}는 필수입니다.` };

  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    return {
      value: parsed,
      error: `${label}는 ${min} 이상 ${max} 이하의 숫자여야 합니다.`,
    };
  }

  return { value: parsed };
};

const parseOptionalInteger = (
  value: string,
  label: string,
  { allowNegative = false, disallowZero = false } = {},
): { value: number | null; error?: string } => {
  if (!value.trim()) return { value: null };

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed)) {
    return { value: parsed, error: `${label}는 정수로 입력해 주세요.` };
  }
  if (!allowNegative && parsed < 0) {
    return { value: parsed, error: `${label}는 0 이상이어야 합니다.` };
  }
  if (disallowZero && parsed === 0) {
    return { value: parsed, error: '층은 0층을 사용할 수 없습니다.' };
  }

  return { value: parsed };
};

const setTextError = (
  errors: StoreRegistrationErrors,
  field: keyof StoreRegistrationDraft,
  label: string,
  value: string,
  required = false,
) => {
  const trimmed = value.trim();
  if (required && !trimmed) {
    errors[field] = `${label}은(는) 필수입니다.`;
    return;
  }
  if (trimmed.length > STORE_TEXT_MAX_LENGTH) {
    errors[field] =
      `${label}은(는) ${STORE_TEXT_MAX_LENGTH}자를 초과할 수 없습니다.`;
  }
};

const setNumberError = (
  errors: StoreRegistrationErrors,
  field: keyof StoreRegistrationDraft,
  result: { error?: string },
) => {
  if (result.error) errors[field] = result.error;
};

const setPriceRangeError = (
  errors: StoreRegistrationErrors,
  min: number | null,
  max: number | null,
  maxField: 'gachaPriceMax' | 'kujiPriceMax' | 'selectGachaPriceMax',
  label: string,
) => {
  if (min !== null && max !== null && min > max) {
    errors[maxField] = `${label} 최대 가격은 최소 가격 이상이어야 합니다.`;
  }
};

export const validateStoreRegistration = (
  draft: StoreRegistrationDraft,
): StoreRegistrationValidation => {
  const errors: StoreRegistrationErrors = {};

  setTextError(errors, 'name', '매장 이름', draft.name, true);
  setTextError(errors, 'address', '매장 주소', draft.address, true);
  setTextError(errors, 'thumbnailUrl', '썸네일 URL', draft.thumbnailUrl);
  setTextError(errors, 'phoneNumber', '전화번호', draft.phoneNumber);
  setTextError(errors, 'instagramId', '인스타그램 ID', draft.instagramId);
  setTextError(errors, 'unit', '호수 또는 점포 번호', draft.unit);
  setTextError(errors, 'businessHours', '영업시간', draft.businessHours);
  setTextError(errors, 'paymentMethods', '결제 방법', draft.paymentMethods);

  const latitude = parseRequiredCoordinate(draft.latitude, '위도', -90, 90);
  const longitude = parseRequiredCoordinate(draft.longitude, '경도', -180, 180);
  setNumberError(errors, 'latitude', latitude);
  setNumberError(errors, 'longitude', longitude);

  const floor = parseOptionalInteger(draft.floor, '층', {
    allowNegative: true,
    disallowZero: true,
  });
  const gachaMachineAmount = parseOptionalInteger(
    draft.gachaMachineAmount,
    '가챠 기계 수',
  );
  const coinPrice = parseOptionalInteger(draft.coinPrice, '동전 가격');
  const gachaPriceMin = parseOptionalInteger(
    draft.gachaPriceMin,
    '가챠 최소 가격',
  );
  const gachaPriceMax = parseOptionalInteger(
    draft.gachaPriceMax,
    '가챠 최대 가격',
  );
  const kujiAmount = parseOptionalInteger(draft.kujiAmount, '쿠지 수');
  const kujiPriceMin = parseOptionalInteger(
    draft.kujiPriceMin,
    '쿠지 최소 가격',
  );
  const kujiPriceMax = parseOptionalInteger(
    draft.kujiPriceMax,
    '쿠지 최대 가격',
  );
  const selectGachaPriceMin = parseOptionalInteger(
    draft.hasSelectGacha ? draft.selectGachaPriceMin : '',
    '선택 가챠 최소 가격',
  );
  const selectGachaPriceMax = parseOptionalInteger(
    draft.hasSelectGacha ? draft.selectGachaPriceMax : '',
    '선택 가챠 최대 가격',
  );

  setNumberError(errors, 'floor', floor);
  setNumberError(errors, 'gachaMachineAmount', gachaMachineAmount);
  setNumberError(errors, 'coinPrice', coinPrice);
  setNumberError(errors, 'gachaPriceMin', gachaPriceMin);
  setNumberError(errors, 'gachaPriceMax', gachaPriceMax);
  setNumberError(errors, 'kujiAmount', kujiAmount);
  setNumberError(errors, 'kujiPriceMin', kujiPriceMin);
  setNumberError(errors, 'kujiPriceMax', kujiPriceMax);
  setNumberError(errors, 'selectGachaPriceMin', selectGachaPriceMin);
  setNumberError(errors, 'selectGachaPriceMax', selectGachaPriceMax);

  setPriceRangeError(
    errors,
    gachaPriceMin.value,
    gachaPriceMax.value,
    'gachaPriceMax',
    '가챠',
  );
  setPriceRangeError(
    errors,
    kujiPriceMin.value,
    kujiPriceMax.value,
    'kujiPriceMax',
    '쿠지',
  );
  setPriceRangeError(
    errors,
    selectGachaPriceMin.value,
    selectGachaPriceMax.value,
    'selectGachaPriceMax',
    '선택 가챠',
  );

  const facilities = [
    ...new Set(
      draft.facilities
        .split(/[,\n]/)
        .map((facility) => facility.trim())
        .filter(Boolean),
    ),
  ];
  if (facilities.some((facility) => facility.length > STORE_TEXT_MAX_LENGTH)) {
    errors.facilities = `편의시설은 항목마다 ${STORE_TEXT_MAX_LENGTH}자를 초과할 수 없습니다.`;
  }

  if (Object.keys(errors).length > 0) return { isValid: false, errors };

  return {
    isValid: true,
    value: {
      name: draft.name.trim(),
      thumbnailUrl: trimOrNull(draft.thumbnailUrl),
      latitude: latitude.value,
      longitude: longitude.value,
      phoneNumber: trimOrNull(draft.phoneNumber),
      instagramId: trimOrNull(draft.instagramId),
      address: draft.address.trim(),
      floor: floor.value,
      unit: trimOrNull(draft.unit),
      businessHours: trimOrNull(draft.businessHours),
      paymentMethods: trimOrNull(draft.paymentMethods),
      gachaMachineAmount: gachaMachineAmount.value,
      coinPrice: coinPrice.value,
      gachaPriceMin: gachaPriceMin.value,
      gachaPriceMax: gachaPriceMax.value,
      kujiAmount: kujiAmount.value,
      kujiPriceMin: kujiPriceMin.value,
      kujiPriceMax: kujiPriceMax.value,
      hasSelectGacha: draft.hasSelectGacha,
      selectGachaPriceMin: draft.hasSelectGacha
        ? selectGachaPriceMin.value
        : null,
      selectGachaPriceMax: draft.hasSelectGacha
        ? selectGachaPriceMax.value
        : null,
      facilities,
      hasRandomBox: draft.hasRandomBox,
    },
  };
};
