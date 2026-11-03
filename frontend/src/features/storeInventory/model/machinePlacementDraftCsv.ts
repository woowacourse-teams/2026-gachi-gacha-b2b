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

export interface ImportedMachinePlacementDraft {
  coinUnit: string;
  rows: MachinePlacementDraftRow[];
  reserveQuantities: MachineReserveQuantities;
  reserveOnlyGachaIds: number[];
  customCoins: string[];
  nextKey: number;
}

const PRESET_COINS = new Set(['4', '6', '8']);
const MAX_GROUP_MACHINES = 1000;
const MAX_TOTAL_RECORDS = 10000;
const MAX_CSV_CHARACTERS = 10_000_000;

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

const DRAFT_STATUS = '작성 초안 · 사이트 미저장';
const ALLOWED_COLUMNS_BY_RECORD = new Map<string, ReadonlySet<number>>([
  ['매장 설정', new Set([0, 1, 2, 7, 15])],
  ['기기 종류', new Set([0, 1, 2, 7, 8, 15])],
  ['기기', new Set([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15])],
  ['보관 재고', new Set([0, 1, 2, 10, 11, 12, 14, 15])],
]);

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
  customCoins: readonly string[] = [],
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

  const groupCounts = new Map<string, number>();
  rows.forEach((row) => {
    const coins = String(Number(row.coinsPerPlay));
    const nextCount = (groupCounts.get(coins) ?? 0) + 1;
    if (nextCount > MAX_GROUP_MACHINES) {
      throw new Error(
        '같은 코인 수의 기기는 1,000대까지만 저장할 수 있습니다.',
      );
    }
    groupCounts.set(coins, nextCount);
  });
  const normalizedCustomCoins: string[] = [];
  customCoins.forEach((coins) => {
    if (!isPositiveSafeInteger(coins)) {
      throw new Error('추가 기기 종류의 회당 코인 수를 확인해 주세요.');
    }
    const normalized = String(Number(coins));
    if (
      PRESET_COINS.has(normalized) ||
      normalizedCustomCoins.includes(normalized)
    ) {
      throw new Error('추가 기기 종류의 코인 수가 중복됩니다.');
    }
    normalizedCustomCoins.push(normalized);
  });
  const gachaById = new Map(gachas.map((gacha) => [gacha.id, gacha]));
  const setupRow = [
    '매장 설정',
    storeId,
    storeName,
    '',
    '',
    '',
    '',
    coinUnit.trim(),
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    DRAFT_STATUS,
  ];
  const groupRows = normalizedCustomCoins.map((coins) => [
    '기기 종류',
    storeId,
    storeName,
    '',
    '',
    '',
    '',
    coinUnit.trim(),
    coins,
    '',
    '',
    '',
    '',
    '',
    '',
    DRAFT_STATUS,
  ]);
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
      DRAFT_STATUS,
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
        DRAFT_STATUS,
      ];
    });

  if (
    1 + normalizedCustomCoins.length + dataRows.length + reserveRows.length >
    MAX_TOTAL_RECORDS
  ) {
    throw new Error('CSV에 담을 데이터가 너무 많습니다.');
  }

  return `\uFEFF${[HEADERS, setupRow, ...groupRows, ...dataRows, ...reserveRows]
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n')}\r\n`;
};

const parseCsvRecords = (csv: string): string[][] => {
  if (csv.length > MAX_CSV_CHARACTERS) {
    throw new Error(
      'CSV 파일이 너무 큽니다. 1,000대 단위로 나눠 확인해 주세요.',
    );
  }
  if (csv.includes('\0')) {
    throw new Error('CSV에 읽을 수 없는 문자가 들어 있습니다.');
  }

  const source = csv.startsWith('\uFEFF') ? csv.slice(1) : csv;
  const records: string[][] = [];
  let record: string[] = [];
  let cell = '';
  let state: 'start' | 'plain' | 'quoted' | 'closed' = 'start';

  const finishCell = () => {
    record.push(cell);
    cell = '';
    state = 'start';
  };
  const finishRecord = () => {
    finishCell();
    records.push(record);
    if (records.length > MAX_TOTAL_RECORDS + 1) {
      throw new Error('CSV 행이 너무 많습니다. 파일 내용을 확인해 주세요.');
    }
    record = [];
  };

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (state === 'quoted') {
      if (character === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          state = 'closed';
        }
      } else {
        cell += character;
      }
      continue;
    }
    if (character === ',') {
      finishCell();
      continue;
    }
    if (character === '\r' || character === '\n') {
      finishRecord();
      if (character === '\r' && source[index + 1] === '\n') index += 1;
      continue;
    }
    if (character === '"') {
      if (state !== 'start') {
        throw new Error(
          'CSV 따옴표 형식이 잘못되었습니다. 파일을 확인해 주세요.',
        );
      }
      state = 'quoted';
      continue;
    }
    if (state === 'closed') {
      throw new Error('CSV 따옴표 뒤에 불필요한 문자가 있습니다.');
    }
    state = 'plain';
    cell += character;
  }

  if (state === 'quoted') {
    throw new Error('CSV의 따옴표가 닫히지 않았습니다. 파일을 확인해 주세요.');
  }
  if (record.length > 0 || state !== 'start' || cell.length > 0) {
    finishRecord();
  }
  while (
    records.length > 0 &&
    records[records.length - 1]?.length === 1 &&
    records[records.length - 1]?.[0] === ''
  ) {
    records.pop();
  }
  return records;
};

const parsePositiveIntegerCell = (value: string, message: string): number => {
  if (!isPositiveSafeInteger(value)) throw new Error(message);
  return Number(value.trim());
};

const parseNonNegativeIntegerCell = (
  value: string,
  message: string,
): string => {
  if (value.trim() && !isNonNegativeSafeInteger(value)) {
    throw new Error(message);
  }
  return value.trim();
};

export const parseMachinePlacementDraftCsv = (
  csv: string,
  storeId: number,
  gachas: readonly MachinePlacementCatalogGacha[],
  fallbackCoinUnit: string,
): ImportedMachinePlacementDraft => {
  if (!Number.isSafeInteger(storeId) || storeId <= 0) {
    throw new Error('현재 매장 ID를 확인할 수 없습니다.');
  }
  const records = parseCsvRecords(csv);
  if (
    records[0]?.length !== HEADERS.length ||
    !HEADERS.every((header, index) => records[0]?.[index] === header)
  ) {
    throw new Error('가치가챠 기기 배치 CSV 양식의 첫 줄이 맞지 않습니다.');
  }
  if (records.length === 1) {
    throw new Error('CSV에 가져올 기기나 보관 품목이 없습니다.');
  }

  const validGachaIds = new Set(gachas.map((gacha) => gacha.id));
  const rawRows: MachinePlacementDraftRow[] = [];
  const reserveQuantities: MachineReserveQuantities = {};
  const reserveIds: number[] = [];
  const seenReserveIds = new Set<number>();
  const explicitCustomCoins: string[] = [];
  const seenSourceKeys = new Set<string>();
  const seenNumericKeys = new Set<number>();
  const seenGroups = new Set<string>();
  const commonUnits: string[] = [];
  let hasSetup = false;

  records.slice(1).forEach((record, index) => {
    const line = index + 2;
    if (record.length !== HEADERS.length) {
      throw new Error(
        `${line}행의 열 수가 16개가 아닙니다. CSV 양식을 확인해 주세요.`,
      );
    }
    const recordStoreId = parsePositiveIntegerCell(
      record[1]!,
      `${line}행의 매장 ID가 올바르지 않습니다.`,
    );
    if (recordStoreId !== storeId) {
      throw new Error('다른 매장의 CSV입니다. 현재 매장 파일을 선택해 주세요.');
    }
    const recordType = record[0]!;
    const allowedColumns = ALLOWED_COLUMNS_BY_RECORD.get(recordType);
    if (!allowedColumns) {
      throw new Error(`${line}행의 레코드 종류를 확인해 주세요.`);
    }
    if (record[15] !== DRAFT_STATUS) {
      throw new Error(
        `${line}행의 데이터 상태는 '${DRAFT_STATUS}'여야 합니다. CSV로 서버 저장 상태를 표시할 수 없습니다.`,
      );
    }
    record.forEach((value, column) => {
      if (!allowedColumns.has(column) && value.trim()) {
        throw new Error(
          `${line}행의 '${HEADERS[column]}' 열은 '${recordType}' 행에서 비워 주세요.`,
        );
      }
    });
    const rawUnit = record[7]!.trim();
    if (rawUnit) {
      parsePositiveIntegerCell(
        rawUnit,
        `${line}행의 매장 코인 단가가 올바르지 않습니다.`,
      );
      commonUnits.push(rawUnit);
    }

    if (recordType === '매장 설정') {
      if (hasSetup) {
        throw new Error('매장 설정 행이 중복되어 있습니다.');
      }
      if (!rawUnit) {
        throw new Error('매장 설정 행에 코인 단가를 입력해 주세요.');
      }
      hasSetup = true;
      return;
    }
    if (recordType === '기기 종류') {
      const coins = String(
        parsePositiveIntegerCell(
          record[8]!,
          `${line}행의 회당 코인 수가 올바르지 않습니다.`,
        ),
      );
      if (!rawUnit) {
        throw new Error(`${line}행의 매장 코인 단가를 입력해 주세요.`);
      }
      if (seenGroups.has(coins)) {
        throw new Error(`${coins}코인 기기 종류 행이 중복되어 있습니다.`);
      }
      seenGroups.add(coins);
      if (!PRESET_COINS.has(coins)) explicitCustomCoins.push(coins);
      return;
    }
    if (recordType === '기기') {
      const rawKey = record[3]!.trim();
      if (!rawKey) {
        throw new Error(`${line}행의 초안 행 ID가 비어 있습니다.`);
      }
      if (seenSourceKeys.has(rawKey)) {
        throw new Error(
          '같은 초안 행 ID가 두 번 있습니다. 기기 행을 확인해 주세요.',
        );
      }
      seenSourceKeys.add(rawKey);
      if (isPositiveSafeInteger(rawKey)) {
        const numericKey = Number(rawKey);
        if (seenNumericKeys.has(numericKey)) {
          throw new Error(
            '같은 초안 행 ID가 두 번 있습니다. 기기 행을 확인해 주세요.',
          );
        }
        seenNumericKeys.add(numericKey);
      }
      const coins = String(
        parsePositiveIntegerCell(
          record[8]!,
          `${line}행의 회당 코인 수가 올바르지 않습니다.`,
        ),
      );
      if (!rawUnit) {
        throw new Error(`${line}행의 매장 코인 단가를 입력해 주세요.`);
      }
      const expectedPrice = calculateMachinePrice(rawUnit, coins);
      if (expectedPrice === undefined) {
        throw new Error(`${line}행의 회당 가격이 너무 큽니다.`);
      }
      if (
        !isNonNegativeSafeInteger(record[9]!) ||
        Number(record[9]) !== expectedPrice
      ) {
        throw new Error(
          `${line}행의 회당 가격이 코인 단가 × 코인 수와 다릅니다. 가격을 확인해 주세요.`,
        );
      }
      const gachaId = record[10]!.trim();
      if (gachaId) {
        const parsedGachaId = parsePositiveIntegerCell(
          gachaId,
          `${line}행의 가챠 ID가 올바르지 않습니다.`,
        );
        if (!validGachaIds.has(parsedGachaId)) {
          throw new Error(
            `${line}행의 가챠는 현재 매장에 등록되지 않았습니다. 매장 목록에서 먼저 등록해 주세요.`,
          );
        }
      }
      rawRows.push({
        key: rawKey,
        machineLabel: '',
        coinsPerPlay: coins,
        area: record[5]!,
        tier: record[6]!.trim(),
        gachaId: gachaId ? String(Number(gachaId)) : '',
        quantity: parseNonNegativeIntegerCell(
          record[13]!,
          `${line}행의 기기 내 확인 수량은 0 이상의 정수여야 합니다.`,
        ),
      });
      return;
    }
    if (recordType === '보관 재고') {
      const gachaId = parsePositiveIntegerCell(
        record[10]!,
        `${line}행의 보관 가챠 ID가 올바르지 않습니다.`,
      );
      if (!validGachaIds.has(gachaId)) {
        throw new Error(
          `${line}행의 가챠는 현재 매장에 등록되지 않았습니다. 매장 목록에서 먼저 등록해 주세요.`,
        );
      }
      if (seenReserveIds.has(gachaId)) {
        throw new Error(`가챠 #${gachaId}의 보관 재고 행이 중복되어 있습니다.`);
      }
      seenReserveIds.add(gachaId);
      reserveIds.push(gachaId);
      reserveQuantities[gachaId] = parseNonNegativeIntegerCell(
        record[14]!,
        `${line}행의 보관 수량은 0 이상의 정수여야 합니다.`,
      );
      return;
    }
  });

  if (rawRows.length === 0 && reserveIds.length === 0) {
    throw new Error('CSV에 가져올 기기나 보관 품목이 없습니다.');
  }
  const normalizedUnits = new Set(commonUnits.map((unit) => Number(unit)));
  if (normalizedUnits.size > 1) {
    throw new Error('CSV의 매장 공통 코인 단가가 행마다 다릅니다.');
  }
  const coinUnit = commonUnits[0] ?? fallbackCoinUnit.trim();
  if (validateCoinUnit(coinUnit)) {
    throw new Error('매장 공통 코인 단가가 올바르지 않습니다.');
  }

  const groupCounts = new Map<string, number>();
  const customCoins = [...explicitCustomCoins];
  rawRows.forEach((row) => {
    const count = (groupCounts.get(row.coinsPerPlay) ?? 0) + 1;
    if (count > MAX_GROUP_MACHINES) {
      throw new Error(`${row.coinsPerPlay}코인 기기가 1,000대를 초과합니다.`);
    }
    groupCounts.set(row.coinsPerPlay, count);
    row.machineLabel = `${row.coinsPerPlay}코인 · ${count}번 기기`;
    if (
      !PRESET_COINS.has(row.coinsPerPlay) &&
      !customCoins.includes(row.coinsPerPlay)
    ) {
      customCoins.push(row.coinsPerPlay);
    }
  });
  const maxNumericKey = Math.max(0, ...seenNumericKeys);
  if (maxNumericKey + rawRows.length >= Number.MAX_SAFE_INTEGER) {
    throw new Error('초안 행 ID가 너무 큽니다. 기기 행을 확인해 주세요.');
  }
  let nextKey = maxNumericKey + 1;
  rawRows.forEach((row) => {
    if (!isPositiveSafeInteger(row.key)) {
      row.key = String(nextKey++);
    }
  });
  const errors = validateMachinePlacementDraft(rawRows, gachas, coinUnit);
  if (Object.keys(errors).length > 0) {
    const firstError = Object.values(errors)[0];
    throw new Error(
      Object.values(firstError ?? {})[0] ??
        'CSV의 기기 배치 정보를 확인해 주세요.',
    );
  }
  const placedGachaIds = new Set(rawRows.map((row) => Number(row.gachaId)));
  return {
    coinUnit,
    rows: rawRows,
    reserveQuantities,
    reserveOnlyGachaIds: reserveIds.filter((id) => !placedGachaIds.has(id)),
    customCoins,
    nextKey,
  };
};
