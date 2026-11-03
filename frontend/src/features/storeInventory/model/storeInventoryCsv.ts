export interface StoreCatalogCsvRow {
  gachaId: number;
  name: string;
  categories: string[];
  source: string;
  catalogCreatedAt: string;
  catalogStatus: '확인됨' | '미확인';
}

const escapeCell = (value: string | number) => {
  const text = String(value);
  const safeText = /^[\s]*[=+\-@]/u.test(text) ? `'${text}` : text;
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
      '카테고리',
      '출처',
      '카탈로그 등록일',
      '카탈로그 정보',
    ],
    ...rows.map((row) => [
      storeId,
      storeName,
      row.gachaId,
      row.name,
      row.categories.join(' / '),
      row.source,
      row.catalogCreatedAt,
      row.catalogStatus,
    ]),
  ];

  return `\uFEFF${lines.map((line) => line.map(escapeCell).join(',')).join('\r\n')}\r\n`;
};
