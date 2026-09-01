import { describe, expect, it } from 'vitest';

import {
  appendCategoryText,
  formatCategoryTextByIds,
  parseCategoryNames,
  removeCategoryText,
  resolveCategoryText,
} from './categoryText';

const categories = [
  { id: 1, name: '산리오' },
  { id: 2, name: '피규어' },
  { id: 3, name: '캡슐토이' },
];

describe('category text', () => {
  it('쉼표와 줄바꿈으로 구분된 이름을 정리하고 중복을 제거한다', () => {
    expect(parseCategoryNames(' 산리오, 피규어\n산리오 ; 캡슐토이 ')).toEqual([
      '산리오',
      '피규어',
      '캡슐토이',
    ]);
  });

  it('등록된 카테고리는 ID로 변환하고 알 수 없는 이름은 분리한다', () => {
    expect(
      resolveCategoryText('산리오, 없는 분류, 피규어', categories),
    ).toEqual({
      categoryIds: [1, 2],
      categoryNames: ['산리오', '없는 분류', '피규어'],
      unknownCategoryNames: ['없는 분류'],
    });
  });

  it('ID 목록과 카테고리 추가·삭제를 수정 가능한 문자열로 변환한다', () => {
    const initialText = formatCategoryTextByIds([1, 2], categories);
    const appendedText = appendCategoryText(initialText, '캡슐토이');

    expect(initialText).toBe('산리오, 피규어');
    expect(appendedText).toBe('산리오, 피규어, 캡슐토이');
    expect(removeCategoryText(appendedText, '피규어')).toBe('산리오, 캡슐토이');
  });
});
