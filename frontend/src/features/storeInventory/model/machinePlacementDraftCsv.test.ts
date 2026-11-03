import { describe, expect, it } from 'vitest';

import {
  calculateMachinePrice,
  createEmptyMachinePlacementRow,
  createMachinePlacementDraftCsv,
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
  ...createEmptyMachinePlacementRow(key),
  machineCode: `A-${key}`,
  gachaId: '1697',
  ...values,
});

describe('machine placement draft CSV', () => {
  it('물리 기기별 배치와 설치 단, 기본 코인 단가, 계산 가격을 내보낸다', () => {
    const rows = [
      row('1', {
        machineCode: 'A-01',
        tier: '2',
        coinsPerPlay: '4',
        quantity: '0',
      }),
      row('2', { machineCode: 'A-02', tier: '3', quantity: '' }),
    ];

    expect(validateMachinePlacementDraft(rows, gachas)).toEqual({});

    const csv = createMachinePlacementDraftCsv(3, '연남점', rows, gachas, {
      1697: '12',
    });
    expect(csv).toMatch(/^\uFEFF"레코드 종류","매장 ID","매장명"/u);
    expect(csv).toContain(
      '"설치 단","코인 단가(원)","회당 코인 수","회당 가격(원)"',
    );
    expect(csv).toContain('"A-01","","2","1000","4","4000"');
    expect(csv).toContain('"A-02","","3","1000","",""');
    expect(csv).toContain('"기기 내 확인 수량","보관 수량","데이터 상태"');
    expect(csv).toContain(
      '"1697","메지루시 악세사리 산리오 캐릭터즈 2","めじるしアクセサリー","0"',
    );
    expect(csv).toContain('"작성 초안 · 사이트 미저장"');
    expect(csv.match(/"보관 재고"/gu)).toHaveLength(1);
    expect(csv).toContain('"めじるしアクセサリー","","12","작성 초안');
    expect(csv).not.toContain('판매량');
  });

  it('설치 단이 달라도 같은 기기 코드를 중복 배치하지 못한다', () => {
    const duplicated = [
      row('1', { machineCode: 'A 01', tier: '1' }),
      row('2', { machineCode: 'ａ０１', tier: '2', gachaId: '1698' }),
    ];

    expect(
      validateMachinePlacementDraft(duplicated, gachas)['1']?.machineCode,
    ).toContain('중복');
    expect(
      validateMachinePlacementDraft(duplicated, gachas)['2']?.machineCode,
    ).toContain('중복');
  });

  it('코인 단가를 기기마다 바꿀 수 있고 코인 수가 없으면 가격을 확정하지 않는다', () => {
    const custom = row('1', { coinUnit: '1500', coinsPerPlay: '12' });
    expect(calculateMachinePrice(custom)).toBe(18000);
    expect(calculateMachinePrice(row('2', { coinsPerPlay: '18' }))).toBe(18000);
    expect(
      calculateMachinePrice(row('3', { coinUnit: '500' })),
    ).toBeUndefined();
    expect(
      validateMachinePlacementDraft(
        [row('4', { coinUnit: '2000', coinsPerPlay: '20' })],
        gachas,
      ),
    ).toEqual({});
    expect(
      createMachinePlacementDraftCsv(3, '연남점', [custom], gachas),
    ).toContain('"1500","12","18000"');
  });

  it('가챠·설치 단·코인 조건·수량의 잘못된 입력을 거부한다', () => {
    const rows = [
      row('1', { machineCode: '', gachaId: '', quantity: '-1' }),
      row('2', {
        gachaId: '9999',
        tier: '0',
        coinUnit: '1e3',
        coinsPerPlay: '1.5',
        quantity: '1.5',
      }),
    ];
    const errors = validateMachinePlacementDraft(rows, gachas);

    expect(errors['1']?.machineCode).toBeTruthy();
    expect(errors['1']?.gachaId).toBeTruthy();
    expect(errors['1']?.quantity).toBeTruthy();
    expect(errors['2']?.gachaId).toContain('현재 매장');
    expect(errors['2']?.tier).toBeTruthy();
    expect(errors['2']?.coinUnit).toBeTruthy();
    expect(errors['2']?.coinsPerPlay).toBeTruthy();
    expect(errors['2']?.quantity).toBeTruthy();
    expect(() =>
      createMachinePlacementDraftCsv(3, '연남점', rows, gachas),
    ).toThrow('확인한 뒤');
  });

  it('정수 범위를 넘는 코인 단가×코인 수를 거부한다', () => {
    const tooExpensive = row('1', {
      coinUnit: String(Number.MAX_SAFE_INTEGER),
      coinsPerPlay: '2',
    });

    expect(
      validateMachinePlacementDraft([tooExpensive], gachas)['1']?.coinsPerPlay,
    ).toContain('너무 큽니다');
    expect(() =>
      createMachinePlacementDraftCsv(3, '연남점', [tooExpensive], gachas),
    ).toThrow();
  });

  it('매장명·기기 코드·상품명의 CSV 수식과 따옴표를 방어한다', () => {
    const csv = createMachinePlacementDraftCsv(
      3,
      '=HYPERLINK("https://example.com")',
      [
        row('1', {
          machineCode: '@SUM(1)',
          area: '입구, "오른쪽"',
          coinUnit: '500',
          coinsPerPlay: '6',
          quantity: '5',
        }),
      ],
      [{ id: 1697, name: ' +1', nameJa: '＝SUM(1)' }],
    );

    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
    expect(csv).toContain('"\'@SUM(1)"');
    expect(csv).toContain('"입구, ""오른쪽"""');
    expect(csv).toContain('"500","6","3000"');
    expect(csv).toContain('"\' +1"');
    expect(csv).toContain('"\'＝SUM(1)"');
  });

  it('보관 수량은 선택 상품별로 검증하고 미확인 값은 비워 둔다', () => {
    const rows = [row('1'), row('2', { gachaId: '1697' })];

    expect(
      validateMachineReserveQuantities(rows, { 1697: '-1' })[1697],
    ).toContain('0 이상');
    expect(
      validateMachineReserveQuantities(rows, { 1697: '1.5' })[1697],
    ).toContain('정수');
    expect(validateMachineReserveQuantities(rows, { 1697: '' })).toEqual({});
    expect(validateMachineReserveQuantities(rows, { 1698: '-5' })).toEqual({});
  });

  it('아직 기기에 넣지 않은 상품도 보관 재고만 한 번 내보낸다', () => {
    const csv = createMachinePlacementDraftCsv(
      3,
      '연남점',
      [createEmptyMachinePlacementRow('1')],
      gachas,
      { 1697: '24' },
      [1697],
    );

    expect(csv.match(/"보관 재고"/gu)).toHaveLength(1);
    expect(csv).not.toContain('"기기 배치"');
    expect(csv).toContain('"めじるしアクセサリー","","24","작성 초안');
    expect(
      validateMachineReserveQuantities([], { 1697: '-1' }, [1697])[1697],
    ).toContain('0 이상');
  });
});
