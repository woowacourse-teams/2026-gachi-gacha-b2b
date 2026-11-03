import { describe, expect, it } from 'vitest';

import { createKujiFieldSheetCsv } from './kujiFieldSheetCsv';

describe('kuji field sheet CSV', () => {
  it('매장 정보만 채운 상자·등급 기록 양식을 만든다', () => {
    const csv = createKujiFieldSheetCsv(3, '연남 가챠점');

    expect(csv).toBe(
      '\uFEFF"매장 ID","매장명","쿠지 타이틀","상자 ID","1회 가격","등급","초기 장수","현재 장수","라스트원 유무","라스트원 지급 여부","최종 실사일","메모"\r\n' +
        '"3","연남 가챠점","","","","","","","","","",""\r\n',
    );
    expect(csv).not.toContain('총 잔여');
  });

  it('매장명의 쉼표와 따옴표를 CSV 셀 안에 보존한다', () => {
    const csv = createKujiFieldSheetCsv(7, '서울, "본점"');

    expect(csv).toContain('"7","서울, ""본점""","",""');
  });

  it.each([
    [
      '\t=HYPERLINK("https://example.com")',
      '\'\t=HYPERLINK(""https://example.com"")',
    ],
    [' +1', "' +1"],
    ['\r\n-1', "'\r\n-1"],
    ['\u200B@SUM(1)', "'\u200B@SUM(1)"],
  ])(
    '수식으로 해석될 수 있는 매장명 %s을 텍스트로 내보낸다',
    (name, escaped) => {
      const csv = createKujiFieldSheetCsv(7, name);

      expect(csv).toContain(`"7","${escaped}"`);
    },
  );
});
