import { describe, expect, it } from 'vitest';

import { isDuplicateCategory, toggleCategory } from './category';

describe('category model', () => {
  it('카테고리 이름의 앞뒤 및 연속 공백을 무시해 중복을 판단한다', () => {
    const categories = [{ id: 1, name: '캐릭터 피규어' }];

    expect(isDuplicateCategory(categories, '  캐릭터   피규어 ')).toBe(true);
  });

  it('선택되지 않은 카테고리는 추가하고 선택된 카테고리는 제거한다', () => {
    expect(toggleCategory([1], 2)).toEqual([1, 2]);
    expect(toggleCategory([1, 2], 2)).toEqual([1]);
  });
});
