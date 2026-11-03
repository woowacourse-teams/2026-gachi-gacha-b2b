import { describe, expect, it } from 'vitest';

import { createStoreCatalogCsv } from './storeInventoryCsv';

describe('store catalog CSV', () => {
  it('한국어 상품 목록을 내보내고 스프레드시트 수식 입력을 막는다', () => {
    const csv = createStoreCatalogCsv(3, '연남 가챠점', [
      {
        gachaId: 105,
        name: '=HYPERLINK("https://example.com")',
        nameKo: '산리오 가챠',
        nameJa: 'サンリオ ガチャ',
        aliases: ['캐릭터', ' =SUM(1,1)'],
        work: '산리오',
        series: '미니 피규어',
        characters: ['헬로키티'],
        reviewedAt: '2026-11-01',
        categories: ['산리오', '캐릭터'],
        source: 'BANDAI',
        catalogCreatedAt: '2026-09-01',
        catalogStatus: '확인됨',
      },
    ]);

    expect(csv).toMatch(/^\uFEFF"매장 ID","매장명"/u);
    expect(csv).toContain('"연남 가챠점"');
    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
    expect(csv).toContain('"산리오 / 캐릭터"');
    expect(csv).toContain('"한국어 이름","일본어 이름"');
    expect(csv).toContain('"サンリオ ガチャ"');
    expect(csv).toContain('"작품","시리즈","캐릭터"');
    expect(csv).toContain('"2026-11-01"');
    expect(csv).toContain('"카탈로그 정보"');
    expect(csv).toContain('"확인됨"');
    expect(csv).not.toContain('재고 수량');
  });

  it('추가 정보 필드에서도 수식과 줄바꿈을 안전하게 내보낸다', () => {
    const csv = createStoreCatalogCsv(3, '연남 가챠점', [
      {
        gachaId: 106,
        name: '테스트',
        nameJa: ' \u200B=HYPERLINK("https://example.com")',
        work: '첫째 줄\n둘째 줄',
        categories: [],
        source: '',
        catalogCreatedAt: '',
        catalogStatus: '확인됨',
      },
    ]);

    expect(csv).toContain('"\' \u200B=HYPERLINK(""https://example.com"")"');
    expect(csv).toContain('"첫째 줄\n둘째 줄"');
  });

  it('카탈로그에서 사라진 등록 상품은 미확인으로 표시한다', () => {
    const csv = createStoreCatalogCsv(3, '연남 가챠점', [
      {
        gachaId: 999,
        name: '가챠 #999',
        categories: [],
        source: '',
        catalogCreatedAt: '',
        catalogStatus: '미확인',
      },
    ]);

    expect(csv).toContain('"가챠 #999"');
    expect(csv).toContain('"미확인"');
  });
});
