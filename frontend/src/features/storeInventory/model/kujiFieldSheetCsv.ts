const HEADERS = [
  '매장 ID',
  '매장명',
  '쿠지 타이틀',
  '상자 ID',
  '1회 가격',
  '등급',
  '초기 장수',
  '현재 장수',
  '라스트원 유무',
  '라스트원 지급 여부',
  '최종 실사일',
  '메모',
] as const;

const escapeCell = (value: string | number): string => {
  const cell = String(value);
  const safeCell = /^[\s\u200B\u200C\u200D]*[=+\-@]/u.test(cell)
    ? `'${cell}`
    : cell;
  return `"${safeCell.replace(/"/gu, '""')}"`;
};

export const createKujiFieldSheetCsv = (
  storeId: number,
  storeName: string,
): string => {
  const blankGradeRow = [storeId, storeName, ...HEADERS.slice(2).map(() => '')];
  return `\uFEFF${[HEADERS, blankGradeRow]
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n')}\r\n`;
};
