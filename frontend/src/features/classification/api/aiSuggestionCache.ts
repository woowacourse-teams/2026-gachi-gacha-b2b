import type { AiProvider } from '@/features/ai/model/aiSettings';

import type { AiCategorySuggestion } from '../model/aiSuggestion';

const CACHE_PREFIX = 'gachi-gacha:ai-category-suggestion';

const getCacheKey = (
  itemId: number,
  itemVersion: number,
  provider: AiProvider,
) => `${CACHE_PREFIX}:${provider}:${itemId}:${itemVersion}`;

const hasStringArray = (value: Record<string, unknown>, key: string) => {
  const items = value[key];
  return (
    Array.isArray(items) && items.every((item) => typeof item === 'string')
  );
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isSuggestion = (value: unknown): value is AiCategorySuggestion =>
  isRecord(value) &&
  typeof value.translatedName === 'string' &&
  hasStringArray(value, 'workNames') &&
  hasStringArray(value, 'characterNames') &&
  hasStringArray(value, 'categoryNames') &&
  'model' in value &&
  typeof value.model === 'string' &&
  'generatedAt' in value &&
  typeof value.generatedAt === 'string';

export const getCachedAiSuggestion = (
  itemId: number,
  itemVersion: number,
  provider: AiProvider,
): AiCategorySuggestion | null => {
  try {
    const cachedValue = sessionStorage.getItem(
      getCacheKey(itemId, itemVersion, provider),
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
  provider: AiProvider,
  suggestion: AiCategorySuggestion,
) => {
  try {
    sessionStorage.setItem(
      getCacheKey(itemId, itemVersion, provider),
      JSON.stringify(suggestion),
    );
  } catch {
    // 브라우저 저장소가 차단되어도 AI 추천 자체는 사용할 수 있습니다.
  }
};

export const clearCachedAiSuggestion = (
  itemId: number,
  itemVersion: number,
  provider: AiProvider,
) => {
  try {
    sessionStorage.removeItem(getCacheKey(itemId, itemVersion, provider));
  } catch {
    // 저장소 접근 실패는 재요청을 막지 않습니다.
  }
};
