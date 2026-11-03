import { describe, expect, it } from 'vitest';

import {
  calculateMachinePrice,
  createEmptyMachinePlacementRow,
  createMachinePlacementDraftCsv,
  hasMachinePlacementContent,
  parseMachinePlacementDraftCsv,
  validateCoinUnit,
  validateMachinePlacementDraft,
  validateMachineReserveQuantities,
  type MachinePlacementDraftRow,
} from './machinePlacementDraftCsv';

const gachas = [
  {
    id: 1697,
    name: '메지루시 악세사리 산리오 캐릭터즈 2',
    nameJa: 'めじるしアクセサリー',
  },
  { id: 1698, name: '다른 가챠' },
];

const row = (
  key: string,
  values: Partial<MachinePlacementDraftRow> = {},
): MachinePlacementDraftRow => ({
  ...createEmptyMachinePlacementRow(key, '4코인 · 1번', '4'),
  gachaId: '1697',
  ...values,
});

const replaceRecordCell = (
  csv: string,
  recordType: string,
  column: number,
  replacement: string,
): string => {
  const lines = csv.trimEnd().split('\r\n');
  const line = lines.findIndex((candidate) =>
    candidate.startsWith(`"${recordType}"`),
  );
  if (line < 0) throw new Error(`테스트용 ${recordType} 행이 없습니다.`);
  const cells = lines[line]!.slice(1, -1).split('","');
  cells[column] = replacement;
  lines[line] = cells.map((cell) => `"${cell}"`).join(',');
  return lines.join('\r\n');
};

describe('machine placement draft CSV', () => {
  it('자동 기기 번호와 빈 기기까지 내보내 종류별 대수를 유지한다', () => {
    const rows = [
      row('machine-1', { tier: '2', quantity: '0' }),
      createEmptyMachinePlacementRow('machine-2', '6코인 · 1번', '6'),
    ];

    expect(validateMachinePlacementDraft(rows, gachas, '1000')).toEqual({});
    expect(hasMachinePlacementContent(rows[0]!)).toBe(true);
    expect(hasMachinePlacementContent(rows[1]!)).toBe(false);

    const csv = createMachinePlacementDraftCsv(
      3,
      '연남점',
      rows,
      gachas,
      '1000',
      { 1697: '12' },
    );
    expect(csv).toMatch(/^\uFEFF"레코드 종류","매장 ID","매장명"/u);
    expect(csv).toContain('"초안 행 ID","자동 기기 번호"');
    expect(csv).toContain('"machine-1","4코인 · 1번"');
    expect(csv).toContain('"machine-2","6코인 · 1번"');
    expect(csv).toContain('"1000","4","4000"');
    expect(csv).toContain('"1000","6","6000"');
    expect(csv).toContain('"めじるしアクセサリー","0"');
    expect(csv.match(/"기기"/gu)).toHaveLength(2);
    expect(csv.match(/"보관 재고"/gu)).toHaveLength(1);
    expect(csv).toContain('"작성 초안 · 사이트 미저장"');
    expect(csv).not.toContain('판매량');
  });

  it('매장 공통 코인 단가만 바꾸면 모든 기기 가격이 함께 바뀐다', () => {
    expect(calculateMachinePrice('1500', '12')).toBe(18000);
    expect(calculateMachinePrice('1000', '18')).toBe(18000);
    expect(calculateMachinePrice('500', '')).toBeUndefined();
    expect(validateCoinUnit('0')).toContain('1원 이상');
    expect(validateCoinUnit('1e3')).toContain('정수');
    expect(validateCoinUnit('1500')).toBeUndefined();

    const csv = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [row('machine-1', { coinsPerPlay: '12' })],
      gachas,
      '1500',
    );
    expect(csv).toContain('"1500","12","18000"');
  });

  it('미배치 기기는 허용하지만 수량·가챠·설치 단 오류는 막는다', () => {
    const rows = [
      row('machine-1', { gachaId: '', quantity: '-1' }),
      row('machine-2', { gachaId: '9999', tier: '0', quantity: '1.5' }),
      createEmptyMachinePlacementRow('machine-3', '8코인 · 1번', '8'),
    ];
    const errors = validateMachinePlacementDraft(rows, gachas, '1000');

    expect(errors['machine-1']?.gachaId).toContain('먼저 가챠');
    expect(errors['machine-1']?.quantity).toContain('0 이상');
    expect(errors['machine-2']?.gachaId).toContain('현재 매장');
    expect(errors['machine-2']?.tier).toContain('1 이상');
    expect(errors['machine-2']?.quantity).toContain('0 이상');
    expect(errors['machine-3']).toBeUndefined();
    expect(() =>
      createMachinePlacementDraftCsv(3, '연남점', rows, gachas, '1000'),
    ).toThrow('확인한 뒤');
  });

  it('계산값 오버플로와 내부 기기 ID 중복을 거부한다', () => {
    const priceError = validateMachinePlacementDraft(
      [row('machine-1', { coinsPerPlay: '2' })],
      gachas,
      String(Number.MAX_SAFE_INTEGER),
    );
    expect(priceError['machine-1']?.coinsPerPlay).toContain('너무 큽니다');

    const duplicateError = validateMachinePlacementDraft(
      [row('machine-1'), row('machine-1')],
      gachas,
      '1000',
    );
    expect(duplicateError['machine-1']?.coinsPerPlay).toContain('중복');
  });

  it('매장명·가챠명·위치의 CSV 수식과 따옴표를 방어한다', () => {
    const csv = createMachinePlacementDraftCsv(
      3,
      '=HYPERLINK("https://example.com")',
      [row('machine-1', { area: '입구, "오른쪽"', quantity: '5' })],
      [{ id: 1697, name: ' +1', nameJa: '＝SUM(1)' }],
      '500',
    );

    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
    expect(csv).toContain('"입구, ""오른쪽"""');
    expect(csv).toContain('"500","4","2000"');
    expect(csv).toContain('"\' +1"');
    expect(csv).toContain('"\'＝SUM(1)"');
  });

  it('보관 수량은 선택 상품별로 검증하고 미확인 값은 비워 둔다', () => {
    const rows = [row('machine-1'), row('machine-2')];

    expect(
      validateMachineReserveQuantities(rows, { 1697: '-1' })[1697],
    ).toContain('0 이상');
    expect(validateMachineReserveQuantities(rows, { 1697: '' })).toEqual({});
    expect(validateMachineReserveQuantities(rows, { 1698: '-5' })).toEqual({});
  });

  it('기기 없이 보관 재고만 한 번 내보내며 미입력 초안은 거부한다', () => {
    const csv = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [],
      gachas,
      '1000',
      { 1697: '24' },
      [1697],
    );

    expect(csv.match(/"보관 재고"/gu)).toHaveLength(1);
    expect(csv).not.toContain('"기기"');
    expect(csv).toContain('"めじるしアクセサリー","","24"');
    expect(() =>
      createMachinePlacementDraftCsv(3, '연남점', [], gachas, '1000'),
    ).toThrow();
  });

  it('다운로드 CSV를 다시 읽어 코인 단가·0대 기기 종류·배치·보관 수량을 복원한다', () => {
    const originalRows = [
      row('1', {
        area: '입구, "오른쪽"\n2층',
        tier: '2',
        quantity: '5',
      }),
      createEmptyMachinePlacementRow('2', '18코인 · 1번 기기', '18'),
    ];
    const exported = createMachinePlacementDraftCsv(
      3,
      '연남점',
      originalRows,
      gachas,
      '1200',
      { 1697: '12', 1698: '24' },
      [1698],
      ['18', '10'],
    );
    const changedDisplayText = exported
      .replace('4코인 · 1번', '신뢰하지 않을 기기 이름')
      .replace(
        '메지루시 악세사리 산리오 캐릭터즈 2',
        '신뢰하지 않을 가챠 이름',
      );

    expect(exported).toContain('"매장 설정"');
    expect(exported).toContain('"기기 종류"');
    expect(
      parseMachinePlacementDraftCsv(changedDisplayText, 3, gachas, '900'),
    ).toEqual({
      coinUnit: '1200',
      rows: [
        { ...originalRows[0], machineLabel: '4코인 · 1번 기기' },
        { ...originalRows[1], machineLabel: '18코인 · 1번 기기' },
      ],
      reserveQuantities: { 1697: '12', 1698: '24' },
      reserveOnlyGachaIds: [1698],
      customCoins: ['18', '10'],
      nextKey: 3,
    });
  });

  it('기기 없이 보관 품목만 있어도 CSV의 코인 단가를 유지한다', () => {
    const exported = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [],
      gachas,
      '1500',
      { 1698: '4' },
      [1698],
      ['12'],
    );

    expect(parseMachinePlacementDraftCsv(exported, 3, gachas, '1000')).toEqual({
      coinUnit: '1500',
      rows: [],
      reserveQuantities: { 1698: '4' },
      reserveOnlyGachaIds: [1698],
      customCoins: ['12'],
      nextKey: 1,
    });
  });

  it('설정 행이 없던 이전 형식과 문자형 기기 ID도 읽고, 보관 전용 파일에는 매장 단가를 적용한다', () => {
    const exported = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [row('machine-1', { area: '창가', coinsPerPlay: '18' })],
      gachas,
      '1000',
    );
    const legacy = exported
      .split('\r\n')
      .filter(
        (line) =>
          line !== '' &&
          !line.startsWith('"매장 설정"') &&
          !line.startsWith('"기기 종류"'),
      )
      .join('\r\n');
    const imported = parseMachinePlacementDraftCsv(legacy, 3, gachas, '700');

    expect(imported.coinUnit).toBe('1000');
    expect(imported.rows[0]).toEqual({
      ...row('1', {
        area: '창가',
        coinsPerPlay: '18',
        machineLabel: '18코인 · 1번 기기',
      }),
    });
    expect(imported.customCoins).toEqual(['18']);
    expect(imported.nextKey).toBe(2);

    const reserveOnly = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [],
      gachas,
      '1000',
      { 1697: '9' },
      [1697],
    );
    const legacyReserveOnly = reserveOnly
      .split('\r\n')
      .filter((line) => line !== '' && !line.startsWith('"매장 설정"'))
      .join('\r\n');
    expect(
      parseMachinePlacementDraftCsv(legacyReserveOnly, 3, gachas, '1300')
        .coinUnit,
    ).toBe('1300');
  });

  it('CSV 수식 방어 접두어를 텍스트 필드에 그대로 보존한다', () => {
    const exported = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [row('1', { area: '=SUM(1,2)' })],
      gachas,
      '1000',
    );
    const imported = parseMachinePlacementDraftCsv(exported, 3, gachas, '1000');

    expect(imported.rows[0]?.area).toBe("'=SUM(1,2)");
    expect(
      createMachinePlacementDraftCsv(
        3,
        '연남점',
        imported.rows,
        gachas,
        imported.coinUnit,
      ),
    ).toContain('"\'=SUM(1,2)"');
  });

  it('헤더·따옴표·다른 매장 파일·빈 파일을 거절한다', () => {
    const exported = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [row('1')],
      gachas,
      '1000',
    );
    expect(() => parseMachinePlacementDraftCsv('', 3, gachas, '1000')).toThrow(
      '첫 줄',
    );
    expect(() =>
      parseMachinePlacementDraftCsv(
        exported.replace('"레코드 종류"', '"다른 헤더"'),
        3,
        gachas,
        '1000',
      ),
    ).toThrow('첫 줄');
    expect(() =>
      parseMachinePlacementDraftCsv(
        exported.replace('"연남점"', '"연남점"오류'),
        3,
        gachas,
        '1000',
      ),
    ).toThrow('따옴표');
    expect(() =>
      parseMachinePlacementDraftCsv(exported, 4, gachas, '1000'),
    ).toThrow('다른 매장');
    expect(() =>
      parseMachinePlacementDraftCsv(
        exported.split('\r\n')[0]!,
        3,
        gachas,
        '1000',
      ),
    ).toThrow('가져올');
  });

  it('중복 기기·보관 행, 다른 매장 가챠, 음수 수량을 거절한다', () => {
    const exported = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [row('1'), row('2', { machineLabel: '4코인 · 2번' })],
      gachas,
      '1000',
      { 1697: '4' },
    );
    expect(() =>
      parseMachinePlacementDraftCsv(
        exported.replace('"2","4코인 · 2번"', '"1","4코인 · 2번"'),
        3,
        gachas,
        '1000',
      ),
    ).toThrow('초안 행 ID');
    expect(() =>
      parseMachinePlacementDraftCsv(
        exported.replace('"1697","메지루시', '"9999","메지루시'),
        3,
        gachas,
        '1000',
      ),
    ).toThrow('현재 매장');
    expect(() =>
      parseMachinePlacementDraftCsv(
        exported.replace(
          '"めじるしアクセサリー","","4"',
          '"めじるしアクセサリー","","-1"',
        ),
        3,
        gachas,
        '1000',
      ),
    ).toThrow('보관 수량');

    const lines = exported.trimEnd().split('\r\n');
    const reserveLine = lines.find((line) => line.startsWith('"보관 재고"'))!;
    expect(() =>
      parseMachinePlacementDraftCsv(
        [...lines, reserveLine].join('\r\n'),
        3,
        gachas,
        '1000',
      ),
    ).toThrow('중복');
  });

  it('코인 단가 불일치와 수동으로 바꾼 회당 가격을 거절한다', () => {
    const exported = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [row('1')],
      gachas,
      '1000',
    );
    expect(() =>
      parseMachinePlacementDraftCsv(
        exported.replace('"1000","4","4000"', '"1000","4","4500"'),
        3,
        gachas,
        '1000',
      ),
    ).toThrow('코인 단가 × 코인 수');
    expect(() =>
      parseMachinePlacementDraftCsv(
        exported.replace('"1000","4","4000"', '"1500","4","6000"'),
        3,
        gachas,
        '1000',
      ),
    ).toThrow('행마다 다릅니다');
  });

  it('한 종류의 기기를 1,000대 넘게 가져오지 않는다', () => {
    const exported = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [row('1')],
      gachas,
      '1000',
    );
    const lines = exported.trimEnd().split('\r\n');
    const machineLine = lines.find((line) => line.startsWith('"기기"'))!;
    const headerAndSetup = lines.filter((line) => !line.startsWith('"기기"'));
    const machines = Array.from({ length: 1001 }, (_, index) =>
      machineLine.replace('"1","4코인', `"${index + 1}","4코인`),
    );
    expect(() =>
      parseMachinePlacementDraftCsv(
        [...headerAndSetup, ...machines].join('\r\n'),
        3,
        gachas,
        '1000',
      ),
    ).toThrow('1,000대를 초과');
  });

  it.each([
    ['매장 설정', 10, '가챠 ID', '1697', 2],
    ['기기 종류', 14, '보관 수량', '3', 3],
    ['기기', 14, '보관 수량', '3', 4],
    ['보관 재고', 13, '기기 내 확인 수량', '3', 5],
    ['보관 재고', 7, '매장 코인 단가(원)', '1000', 5],
  ])(
    '%s 행에 허용되지 않는 %s번째 열이 채워지면 조용히 버리지 않는다',
    (recordType, column, header, value, line) => {
      const exported = createMachinePlacementDraftCsv(
        3,
        '연남점',
        [row('1')],
        gachas,
        '1000',
        { 1697: '4' },
        [],
        ['12'],
      );
      const changed = replaceRecordCell(exported, recordType, column, value);

      expect(() =>
        parseMachinePlacementDraftCsv(changed, 3, gachas, '1000'),
      ).toThrow(`${line}행의 '${header}' 열`);
    },
  );

  it('데이터 상태를 저장 완료로 바꿔도 저장된 것처럼 받아들이지 않는다', () => {
    const exported = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [row('1')],
      gachas,
      '1000',
    );
    const changed = replaceRecordCell(exported, '기기', 15, '서버 저장 완료');

    expect(() =>
      parseMachinePlacementDraftCsv(changed, 3, gachas, '1000'),
    ).toThrow('3행의 데이터 상태');
  });

  it('특수한 레코드 종류와 기기 행 ID도 안전하게 처리한다', () => {
    const exported = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [row('1')],
      gachas,
      '1000',
    );
    expect(() =>
      parseMachinePlacementDraftCsv(
        replaceRecordCell(exported, '기기', 0, '__proto__'),
        3,
        gachas,
        '1000',
      ),
    ).toThrow('레코드 종류');

    const imported = parseMachinePlacementDraftCsv(
      replaceRecordCell(exported, '기기', 3, '__proto__'),
      3,
      gachas,
      '1000',
    );
    expect(imported.rows[0]?.key).toBe('1');
    expect(imported.nextKey).toBe(2);
  });
});
