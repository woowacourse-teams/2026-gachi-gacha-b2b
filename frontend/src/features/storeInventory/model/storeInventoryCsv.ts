export interface StoreCatalogCsvRow {
  gachaId: number;
  name: string;
  nameKo?: string;
  nameJa?: string;
  aliases?: string[];
  work?: string;
  series?: string;
  characters?: string[];
  reviewedAt?: string;
  categories: string[];
  source: string;
  catalogCreatedAt: string;
  catalogStatus: '확인됨' | '미확인';
}

const escapeCell = (value: string | number) => {
  const text = String(value);
  const safeText = /^[\s\u200B\u200C\u200D]*[=+\-@]/u.test(text)
    ? `'${text}`
    : text;
  return `"${safeText.replace(/"/gu, '""')}"`;
};

export const createStoreCatalogCsv = (
  storeId: number,
  storeName: string,
  rows: StoreCatalogCsvRow[],
) => {
  const lines = [
    [
      '매장 ID',
      '매장명',
      '가챠 ID',
      '가챠명',
      '한국어 이름',
      '일본어 이름',
      '검색 별칭',
      '작품',
      '시리즈',
      '캐릭터',
      '카테고리',
      '출처',
      '카탈로그 등록일',
      '추가 정보 검수일',
      '카탈로그 정보',
    ],
    ...rows.map((row) => [
      storeId,
      storeName,
      row.gachaId,
      row.name,
      row.nameKo ?? '',
      row.nameJa ?? '',
      (row.aliases ?? []).join(' / '),
      row.work ?? '',
      row.series ?? '',
      (row.characters ?? []).join(' / '),
      row.categories.join(' / '),
      row.source,
      row.catalogCreatedAt,
      row.reviewedAt ?? '',
      row.catalogStatus,
    ]),
  ];

  return `\uFEFF${lines.map((line) => line.map(escapeCell).join(',')).join('\r\n')}\r\n`;
};
