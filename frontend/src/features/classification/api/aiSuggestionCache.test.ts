import { afterEach, describe, expect, it } from 'vitest';

import {
  cacheAiSuggestion,
  clearCachedAiSuggestion,
  getCachedAiSuggestion,
} from './aiSuggestionCache';

afterEach(() => sessionStorage.clear());

describe('AI suggestion cache', () => {
  it('가챠 ID와 버전이 같은 추천만 다시 사용한다', () => {
    const suggestion = {
      categoryNames: ['피규어', '캐릭터'],
      model: 'mock-model',
      generatedAt: '2026-08-31T12:00:00.000Z',
    };

    cacheAiSuggestion(101, 1, suggestion);

    expect(getCachedAiSuggestion(101, 1)).toEqual(suggestion);
    expect(getCachedAiSuggestion(101, 2)).toBeNull();

    clearCachedAiSuggestion(101, 1);
    expect(getCachedAiSuggestion(101, 1)).toBeNull();
  });
});
