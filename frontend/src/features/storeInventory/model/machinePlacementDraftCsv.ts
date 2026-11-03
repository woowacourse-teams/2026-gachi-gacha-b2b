export interface MachinePlacementDraftRow {
  key: string;
  machineCode: string;
  area: string;
  tier: string;
  coinUnit: string;
  coinsPerPlay: string;
  gachaId: string;
  quantity: string;
}

export const DEFAULT_COIN_UNIT = 1000;

export interface MachinePlacementCatalogGacha {
  id: number;
  name: string;
  nameJa?: string;
}

export type MachinePlacementDraftField = Exclude<
  keyof MachinePlacementDraftRow,
  'key'
>;

export type MachinePlacementDraftErrors = Record<
  string,
  Partial<Record<MachinePlacementDraftField, string>>
>;

export type MachineReserveQuantities = Record<number, string>;
export type MachineReserveErrors = Record<number, string>;

export const createEmptyMachinePlacementRow = (
  key: string,
): MachinePlacementDraftRow => ({
  key,
  machineCode: '',
  area: '',
  tier: '',
  coinUnit: '',
  coinsPerPlay: '',
  gachaId: '',
  quantity: '',
});

export const hasMachinePlacementContent = (row: MachinePlacementDraftRow) =>
  (
    [
      'machineCode',
      'area',
      'tier',
      'coinUnit',
      'coinsPerPlay',
      'gachaId',
      'quantity',
    ] as const
  ).some((field) => row[field].trim().length > 0);

const normalizeLabel = (value: string) =>
  value
    .normalize('NFKC')
    .trim()
    .toLocaleLowerCase('ko-KR')
    .replace(/\s+/gu, '');

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

export const calculateMachinePrice = (
  row: Pick<MachinePlacementDraftRow, 'coinUnit' | 'coinsPerPlay'>,
): number | undefined => {
  const unit = row.coinUnit.trim() || String(DEFAULT_COIN_UNIT);
  const count = row.coinsPerPlay.trim();
  if (!isPositiveSafeInteger(unit) || !isPositiveSafeInteger(count)) {
    return undefined;
  }
  const price = Number(unit) * Number(count);
  return Number.isSafeInteger(price) ? price : undefined;
};

export const validateMachinePlacementDraft = (
  rows: readonly MachinePlacementDraftRow[],
  gachas: readonly MachinePlacementCatalogGacha[],
): MachinePlacementDraftErrors => {
  const errors: MachinePlacementDraftErrors = {};
  const gachaIds = new Set(gachas.map(({ id }) => id));
  const rowsByMachine = new Map<string, MachinePlacementDraftRow[]>();

  rows.filter(hasMachinePlacementContent).forEach((row) => {
    const code = normalizeLabel(row.machineCode);
    if (!code) {
      setError(errors, row.key, 'machineCode', '기기 코드를 입력해 주세요.');
    } else {
      rowsByMachine.set(code, [...(rowsByMachine.get(code) ?? []), row]);
    }

    if (row.tier.trim() && !isPositiveSafeInteger(row.tier)) {
      setError(
        errors,
        row.key,
        'tier',
        '설치 단은 1 이상의 정수로 입력해 주세요.',
      );
    }

    if (!row.gachaId) {
      setError(
        errors,
        row.key,
        'gachaId',
        '매장에 등록된 가챠를 선택해 주세요.',
      );
    } else if (!gachaIds.has(Number(row.gachaId))) {
      setError(
        errors,
        row.key,
        'gachaId',
        '현재 매장에 등록된 가챠가 아닙니다. 목록을 다시 확인해 주세요.',
      );
    }

    if (row.coinUnit.trim() && !isPositiveSafeInteger(row.coinUnit)) {
      setError(
        errors,
        row.key,
        'coinUnit',
        '코인 단가는 1원 이상의 정수로 입력해 주세요.',
      );
    }

    if (row.coinsPerPlay.trim() && !isPositiveSafeInteger(row.coinsPerPlay)) {
      setError(
        errors,
        row.key,
        'coinsPerPlay',
        '회당 코인 수는 1 이상의 정수로 입력해 주세요.',
      );
    } else if (
      row.coinsPerPlay.trim() &&
      !errors[row.key]?.coinUnit &&
      calculateMachinePrice(row) === undefined
    ) {
      setError(
        errors,
        row.key,
        'coinsPerPlay',
        '계산된 회당 가격이 너무 큽니다. 코인 조건을 확인해 주세요.',
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

  rowsByMachine.forEach((sameMachineRows) => {
    if (sameMachineRows.length < 2) return;
    sameMachineRows.forEach((row) =>
      setError(
        errors,
        row.key,
        'machineCode',
        '기기 코드가 중복됩니다. 물리 기기 한 대에는 가챠 한 종류만 배치해 주세요.',
      ),
    );
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
  '기기 코드',
  '매장 내 구역',
  '설치 단',
  '코인 단가(원)',
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
  reserveQuantities: Readonly<MachineReserveQuantities> = {},
  reserveOnlyGachaIds: readonly number[] = [],
): string => {
  const placementRows = rows.filter(hasMachinePlacementContent);
  const errors = validateMachinePlacementDraft(rows, gachas);
  const reserveErrors = validateMachineReserveQuantities(
    rows,
    reserveQuantities,
    reserveOnlyGachaIds,
  );
  if (
    (placementRows.length === 0 && reserveOnlyGachaIds.length === 0) ||
    Object.keys(errors).length > 0 ||
    Object.keys(reserveErrors).length > 0
  ) {
    throw new Error('기기 배치 초안을 확인한 뒤 CSV를 내려받아 주세요.');
  }

  const gachaById = new Map(gachas.map((gacha) => [gacha.id, gacha]));
  const dataRows = placementRows.map((row) => {
    const gacha = gachaById.get(Number(row.gachaId));
    if (!gacha)
      throw new Error('매장 가챠 목록이 바뀌었습니다. 다시 선택해 주세요.');

    return [
      '기기 배치',
      storeId,
      storeName,
      row.machineCode.trim(),
      row.area.trim(),
      row.tier.trim(),
      row.coinUnit.trim() || DEFAULT_COIN_UNIT,
      row.coinsPerPlay.trim(),
      calculateMachinePrice(row) ?? '',
      gacha.id,
      gacha.name,
      gacha.nameJa ?? '',
      row.quantity.trim(),
      '',
      '작성 초안 · 사이트 미저장',
    ];
  });

  const reserveRows = [
    ...new Set([
      ...placementRows.map((row) => Number(row.gachaId)),
      ...reserveOnlyGachaIds,
    ]),
  ].map((gachaId) => {
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
