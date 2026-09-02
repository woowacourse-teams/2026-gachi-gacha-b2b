import { describe, expect, it } from 'vitest';

import {
  EMPTY_STORE_REGISTRATION_DRAFT,
  validateStoreRegistration,
  type StoreRegistrationDraft,
} from './storeRegistration';

const createValidDraft = (
  overrides: Partial<StoreRegistrationDraft> = {},
): StoreRegistrationDraft => ({
  ...EMPTY_STORE_REGISTRATION_DRAFT,
  name: ' 캡슐 스테이션 성수 ',
  address: ' 서울특별시 성동구 연무장길 1 ',
  latitude: '37.5445',
  longitude: '127.0561',
  ...overrides,
});

describe('store registration validation', () => {
  it('입력 문자열을 정리하고 빈 선택값은 null로 변환한다', () => {
    const result = validateStoreRegistration(
      createValidDraft({
        floor: '-1',
        gachaMachineAmount: '20',
        gachaPriceMin: '3000',
        gachaPriceMax: '5000',
        hasSelectGacha: true,
        selectGachaPriceMin: '4000',
        selectGachaPriceMax: '6000',
        facilities: '주차장, 동전교환기\n주차장,  ',
      }),
    );

    expect(result).toEqual({
      isValid: true,
      value: {
        name: '캡슐 스테이션 성수',
        thumbnailUrl: null,
        latitude: 37.5445,
        longitude: 127.0561,
        phoneNumber: null,
        instagramId: null,
        address: '서울특별시 성동구 연무장길 1',
        floor: -1,
        unit: null,
        businessHours: null,
        paymentMethods: null,
        gachaMachineAmount: 20,
        coinPrice: null,
        gachaPriceMin: 3000,
        gachaPriceMax: 5000,
        kujiAmount: null,
        kujiPriceMin: null,
        kujiPriceMax: null,
        hasSelectGacha: true,
        selectGachaPriceMin: 4000,
        selectGachaPriceMax: 6000,
        facilities: ['주차장', '동전교환기'],
        hasRandomBox: false,
      },
    });
  });

  it('백엔드 규약에 맞지 않는 좌표·층·가격 범위를 필드별로 막는다', () => {
    const result = validateStoreRegistration(
      createValidDraft({
        latitude: '91',
        longitude: '-181',
        floor: '0',
        gachaMachineAmount: '-1',
        gachaPriceMin: '5000',
        gachaPriceMax: '3000',
      }),
    );

    expect(result.isValid).toBe(false);
    if (result.isValid) return;

    expect(result.errors).toMatchObject({
      latitude: expect.any(String),
      longitude: expect.any(String),
      floor: expect.any(String),
      gachaMachineAmount: expect.any(String),
      gachaPriceMax: expect.any(String),
    });
  });

  it('선택 가챠를 취급하지 않으면 남아 있는 가격 입력을 전송하지 않는다', () => {
    const result = validateStoreRegistration(
      createValidDraft({
        hasSelectGacha: false,
        selectGachaPriceMin: '-1',
        selectGachaPriceMax: 'invalid',
      }),
    );

    expect(result.isValid).toBe(true);
    if (!result.isValid) return;

    expect(result.value.selectGachaPriceMin).toBeNull();
    expect(result.value.selectGachaPriceMax).toBeNull();
  });
});
