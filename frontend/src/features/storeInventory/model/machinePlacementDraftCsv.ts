export interface MachinePlacementDraftRow {
  key: string;
  machineLabel: string;
  coinsPerPlay: string;
  area: string;
  tier: string;
  gachaId: string;
  quantity: string;
}

export const DEFAULT_COIN_UNIT = 1000;

export interface MachinePlacementCatalogGacha {
  id: number;
  name: string;
  nameJa?: string;
}

export type MachinePlacementDraftField =
  'coinsPerPlay' | 'tier' | 'gachaId' | 'quantity';

export type MachinePlacementDraftErrors = Record<
  string,
  Partial<Record<MachinePlacementDraftField, string>>
>;

export type MachineReserveQuantities = Record<number, string>;
export type MachineReserveErrors = Record<number, string>;

export const createEmptyMachinePlacementRow = (
  key: string,
  machineLabel: string,
  coinsPerPlay: string,
): MachinePlacementDraftRow => ({
  key,
  machineLabel,
  coinsPerPlay,
  area: '',
  tier: '',
  gachaId: '',
  quantity: '',
});

export const hasMachinePlacementContent = (row: MachinePlacementDraftRow) =>
  [row.area, row.tier, row.gachaId, row.quantity].some(
    (value) => value.trim().length > 0,
  );

const setError = (
  errors: MachinePlacementDraftErrors,
  key: string,
  field: MachinePlacementDraftField,
  message: string,
) => {
  errors[key] = { ...errors[key], [field]: message };
};

const isPositiveSafeInteger = (value: string) => {
  const normalized = value.trim();
  const parsed = Number(normalized);
  return (
    /^\d+$/u.test(normalized) && Number.isSafeInteger(parsed) && parsed > 0
  );
};

const isNonNegativeSafeInteger = (value: string) => {
  const normalized = value.trim();
  const parsed = Number(normalized);
  return (
    /^\d+$/u.test(normalized) && Number.isSafeInteger(parsed) && parsed >= 0
  );
};

export const validateCoinUnit = (coinUnit: string): string | undefined =>
  isPositiveSafeInteger(coinUnit)
    ? undefined
    : '매장 공통 코인 단가는 1원 이상의 정수로 입력해 주세요.';

export const calculateMachinePrice = (
  coinUnit: string,
  coinsPerPlay: string,
): number | undefined => {
  if (
    !isPositiveSafeInteger(coinUnit) ||
    !isPositiveSafeInteger(coinsPerPlay)
  ) {
    return undefined;
  }
  const price = Number(coinUnit) * Number(coinsPerPlay);
  return Number.isSafeInteger(price) ? price : undefined;
};

export const validateMachinePlacementDraft = (
  rows: readonly MachinePlacementDraftRow[],
  gachas: readonly MachinePlacementCatalogGacha[],
  coinUnit: string,
): MachinePlacementDraftErrors => {
  const errors: MachinePlacementDraftErrors = {};
  const gachaIds = new Set(gachas.map(({ id }) => id));
  const seenKeys = new Set<string>();

  rows.forEach((row) => {
    if (!row.key || seenKeys.has(row.key)) {
      setError(
        errors,
        row.key,
        'coinsPerPlay',
        '자동 기기 번호가 중복됩니다. 기기 구성을 다시 확인해 주세요.',
      );
    }
    seenKeys.add(row.key);

    if (!isPositiveSafeInteger(row.coinsPerPlay)) {
      setError(
        errors,
        row.key,
        'coinsPerPlay',
        '회당 코인 수는 1 이상의 정수여야 합니다.',
      );
    } else if (
      !validateCoinUnit(coinUnit) &&
      calculateMachinePrice(coinUnit, row.coinsPerPlay) === undefined
    ) {
      setError(
        errors,
        row.key,
        'coinsPerPlay',
        '계산된 회당 가격이 너무 큽니다. 코인 조건을 확인해 주세요.',
      );
    }

    if (row.tier.trim() && !isPositiveSafeInteger(row.tier)) {
      setError(
        errors,
        row.key,
        'tier',
        '설치 단은 1 이상의 정수로 입력해 주세요.',
      );
    }

    if (row.gachaId && !gachaIds.has(Number(row.gachaId))) {
      setError(
        errors,
        row.key,
        'gachaId',
        '현재 매장에 등록된 가챠가 아닙니다. 목록을 다시 확인해 주세요.',
      );
    } else if (!row.gachaId && row.quantity.trim()) {
      setError(
        errors,
        row.key,
        'gachaId',
        '기기 수량을 적으려면 먼저 가챠를 배치해 주세요.',
      );
    }

    if (row.quantity.trim() && !isNonNegativeSafeInteger(row.quantity)) {
      setError(
        errors,
        row.key,
        'quantity',
        '기기 내 확인 수량은 0 이상의 정수로 입력해 주세요.',
      );
    }
  });

  return errors;
};

export const validateMachineReserveQuantities = (
  rows: readonly MachinePlacementDraftRow[],
  reserveQuantities: Readonly<MachineReserveQuantities>,
  reserveOnlyGachaIds: readonly number[] = [],
): MachineReserveErrors => {
  const errors: MachineReserveErrors = {};
  const selectedGachaIds = new Set([
    ...rows.map((row) => Number(row.gachaId)),
    ...reserveOnlyGachaIds,
  ]);

  selectedGachaIds.forEach((gachaId) => {
    if (!Number.isSafeInteger(gachaId) || gachaId <= 0) return;
    const quantity = reserveQuantities[gachaId] ?? '';
    if (quantity.trim() && !isNonNegativeSafeInteger(quantity)) {
      errors[gachaId] = '보관 수량은 0 이상의 정수로 입력해 주세요.';
    }
  });

  return errors;
};

const HEADERS = [
  '레코드 종류',
  '매장 ID',
  '매장명',
  '초안 행 ID',
  '자동 기기 번호',
  '매장 내 구역',
  '설치 단',
  '매장 코인 단가(원)',
  '회당 코인 수',
  '회당 가격(원)',
  '가챠 ID',
  '가챠 이름',
  '일본어 이름',
  '기기 내 확인 수량',
  '보관 수량',
  '데이터 상태',
] as const;

const escapeCell = (value: string | number): string => {
  const cell = String(value);
  const safeCell = /^[\s\u200B\u200C\u200D]*[=+\-@]/u.test(
    cell.normalize('NFKC'),
  )
    ? `'${cell}`
    : cell;
  return `"${safeCell.replace(/"/gu, '""')}"`;
};

export const createMachinePlacementDraftCsv = (
  storeId: number,
  storeName: string,
  rows: readonly MachinePlacementDraftRow[],
  gachas: readonly MachinePlacementCatalogGacha[],
  coinUnit: string,
  reserveQuantities: Readonly<MachineReserveQuantities> = {},
  reserveOnlyGachaIds: readonly number[] = [],
): string => {
  const errors = validateMachinePlacementDraft(rows, gachas, coinUnit);
  const reserveErrors = validateMachineReserveQuantities(
    rows,
    reserveQuantities,
    reserveOnlyGachaIds,
  );
  if (
    (rows.length === 0 && reserveOnlyGachaIds.length === 0) ||
    validateCoinUnit(coinUnit) ||
    Object.keys(errors).length > 0 ||
    Object.keys(reserveErrors).length > 0
  ) {
    throw new Error('기기 배치 초안을 확인한 뒤 CSV를 내려받아 주세요.');
  }

  const gachaById = new Map(gachas.map((gacha) => [gacha.id, gacha]));
  const dataRows = rows.map((row) => {
    const gacha = row.gachaId ? gachaById.get(Number(row.gachaId)) : undefined;
    if (row.gachaId && !gacha)
      throw new Error('매장 가챠 목록이 바뀌었습니다. 다시 선택해 주세요.');

    return [
      '기기',
      storeId,
      storeName,
      row.key,
      row.machineLabel,
      row.area.trim(),
      row.tier.trim(),
      coinUnit.trim(),
      row.coinsPerPlay.trim(),
      calculateMachinePrice(coinUnit, row.coinsPerPlay) ?? '',
      gacha?.id ?? '',
      gacha?.name ?? '',
      gacha?.nameJa ?? '',
      row.quantity.trim(),
      '',
      '작성 초안 · 사이트 미저장',
    ];
  });

  const reserveRows = [
    ...new Set([
      ...rows.map((row) => Number(row.gachaId)),
      ...reserveOnlyGachaIds,
    ]),
  ]
    .filter((gachaId) => Number.isSafeInteger(gachaId) && gachaId > 0)
    .map((gachaId) => {
      const gacha = gachaById.get(gachaId);
      if (!gacha)
        throw new Error('매장 가챠 목록이 바뀌었습니다. 다시 선택해 주세요.');

      return [
        '보관 재고',
        storeId,
        storeName,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        gacha.id,
        gacha.name,
        gacha.nameJa ?? '',
        '',
        (reserveQuantities[gachaId] ?? '').trim(),
        '작성 초안 · 사이트 미저장',
      ];
    });

  return `\uFEFF${[HEADERS, ...dataRows, ...reserveRows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n')}\r\n`;
};
