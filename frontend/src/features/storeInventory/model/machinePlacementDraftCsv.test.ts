import { describe, expect, it } from 'vitest';

import {
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
  it('한 기기의 다른 슬롯에 배치한 같은 가챠를 허용하고 미확인 수량은 비워 둔다', () => {
    const rows = [
      row('1', { machineCode: 'A-01', slot: '상단', quantity: '0' }),
      row('2', { machineCode: 'Ａ-０１', slot: '하단', quantity: '' }),
    ];

    expect(validateMachinePlacementDraft(rows, gachas)).toEqual({});

    const csv = createMachinePlacementDraftCsv(3, '연남점', rows, gachas, {
      1697: '12',
    });
    expect(csv).toMatch(/^\uFEFF"레코드 종류","매장 ID","매장명"/u);
    expect(csv).toContain('"기기 내 확인 수량","보관 수량","데이터 상태"');
    expect(csv).toContain(
      '"1697","메지루시 악세사리 산리오 캐릭터즈 2","めじるしアクセサリー","0"',
    );
    expect(csv).toContain('"작성 초안 · 사이트 미저장"');
    expect(csv.match(/"보관 재고"/gu)).toHaveLength(1);
    expect(csv).toContain('"めじるしアクセサリー","","12","작성 초안');
    expect(csv).not.toContain('판매량');
  });

  it('같은 기기의 동일 슬롯 또는 빈 슬롯 중복을 막는다', () => {
    const repeatedSlot = [
      row('1', { machineCode: 'A 01', slot: '1' }),
      row('2', { machineCode: 'ａ０１', slot: '１' }),
    ];
    const repeatedWithoutSlot = [
      row('1', { machineCode: 'A-01' }),
      row('2', { machineCode: 'a-01', slot: '1' }),
    ];

    expect(
      validateMachinePlacementDraft(repeatedSlot, gachas)['1']?.slot,
    ).toContain('중복');
    expect(
      validateMachinePlacementDraft(repeatedSlot, gachas)['2']?.slot,
    ).toContain('중복');
    expect(
      validateMachinePlacementDraft(repeatedWithoutSlot, gachas)['1']?.slot,
    ).toContain('각 행');
    expect(
      validateMachinePlacementDraft(repeatedWithoutSlot, gachas)['2']?.slot,
    ).toContain('각 행');
  });

  it('가챠 미선택·매장 미등록, 음수·소수·과학 표기 수량을 거부한다', () => {
    const rows = [
      row('1', { machineCode: '', gachaId: '', quantity: '-1' }),
      row('2', { gachaId: '9999', pricePerPlay: '1e3', quantity: '1.5' }),
    ];
    const errors = validateMachinePlacementDraft(rows, gachas);

    expect(errors['1']?.machineCode).toBeTruthy();
    expect(errors['1']?.gachaId).toBeTruthy();
    expect(errors['1']?.quantity).toBeTruthy();
    expect(errors['2']?.gachaId).toContain('현재 매장');
    expect(errors['2']?.pricePerPlay).toBeTruthy();
    expect(errors['2']?.quantity).toBeTruthy();
    expect(() =>
      createMachinePlacementDraftCsv(3, '연남점', rows, gachas),
    ).toThrow('확인한 뒤');
  });

  it('매장명·기기 코드·상품명의 CSV 수식과 따옴표를 방어한다', () => {
    const csv = createMachinePlacementDraftCsv(
      3,
      '=HYPERLINK("https://example.com")',
      [
        row('1', {
          machineCode: '@SUM(1)',
          area: '입구, "오른쪽"',
          pricePerPlay: '3000',
          quantity: '5',
        }),
      ],
      [{ id: 1697, name: ' +1', nameJa: '＝SUM(1)' }],
    );

    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
    expect(csv).toContain('"\'@SUM(1)"');
    expect(csv).toContain('"입구, ""오른쪽"""');
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
