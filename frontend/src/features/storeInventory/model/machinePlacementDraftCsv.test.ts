import { describe, expect, it } from 'vitest';

import {
  calculateMachinePrice,
  createEmptyMachinePlacementRow,
  createMachinePlacementDraftCsv,
  hasMachinePlacementContent,
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
});
