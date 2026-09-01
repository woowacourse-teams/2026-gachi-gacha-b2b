import type { AiCategorySuggestion } from '../model/aiSuggestion';

const CACHE_PREFIX = 'gachi-gacha:ai-category-suggestion';

const getCacheKey = (itemId: number, itemVersion: number) =>
  `${CACHE_PREFIX}:${itemId}:${itemVersion}`;

const isSuggestion = (value: unknown): value is AiCategorySuggestion =>
  typeof value === 'object' &&
  value !== null &&
  'categoryNames' in value &&
  Array.isArray(value.categoryNames) &&
  value.categoryNames.every((name) => typeof name === 'string') &&
  'model' in value &&
  typeof value.model === 'string' &&
  'generatedAt' in value &&
  typeof value.generatedAt === 'string';

export const getCachedAiSuggestion = (
  itemId: number,
  itemVersion: number,
): AiCategorySuggestion | null => {
  try {
    const cachedValue = sessionStorage.getItem(
      getCacheKey(itemId, itemVersion),
    );
    if (!cachedValue) return null;

    const suggestion: unknown = JSON.parse(cachedValue);
    return isSuggestion(suggestion) ? suggestion : null;
  } catch {
    return null;
  }
};

export const cacheAiSuggestion = (
  itemId: number,
  itemVersion: number,
  suggestion: AiCategorySuggestion,
) => {
  try {
    sessionStorage.setItem(
      getCacheKey(itemId, itemVersion),
      JSON.stringify(suggestion),
    );
  } catch {
    // 브라우저 저장소가 차단되어도 AI 추천 자체는 사용할 수 있습니다.
  }
};

export const clearCachedAiSuggestion = (
  itemId: number,
  itemVersion: number,
) => {
  try {
    sessionStorage.removeItem(getCacheKey(itemId, itemVersion));
  } catch {
    // 저장소 접근 실패는 재요청을 막지 않습니다.
  }
};
