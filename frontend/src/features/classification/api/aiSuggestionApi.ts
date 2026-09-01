import { requestFrom } from '@/apis/httpClient';
import type { AiCredentials } from '@/features/ai/model/aiSettings';

import type {
  AiCategorySuggestionDto,
  AiCategorySuggestionRequestDto,
} from './aiSuggestion.dto';
import { cacheAiSuggestion, getCachedAiSuggestion } from './aiSuggestionCache';
import type { AiCategorySuggestion } from '../model/aiSuggestion';
import type { Category, ClassificationItem } from '../model/classification';

const toAiSuggestion = (
  dto: AiCategorySuggestionDto,
): AiCategorySuggestion => ({
  translatedName: dto.translatedName,
  workNames: dto.workNames,
  characterNames: dto.characterNames,
  categoryNames: dto.categoryNames,
  model: dto.model,
  generatedAt: dto.generatedAt,
});

export const getAiCategorySuggestion = async (
  item: ClassificationItem,
  categories: Category[],
  {
    credentials,
    force = false,
    onRequest,
    signal,
  }: {
    credentials: AiCredentials;
    force?: boolean;
    onRequest?: () => void;
    signal?: AbortSignal;
  },
): Promise<AiCategorySuggestion> => {
  if (!force) {
    const cachedSuggestion = getCachedAiSuggestion(
      item.id,
      item.version,
      credentials.provider,
    );
    if (cachedSuggestion) return cachedSuggestion;
  }

  const body: AiCategorySuggestionRequestDto = {
    itemId: item.id,
    itemVersion: item.version,
    imageUrl: item.imageUrl,
    name: item.name,
    allowedCategoryNames: categories.map(({ name }) => name),
  };
  onRequest?.();

  const suggestion = await requestFrom<AiCategorySuggestionDto>(
    __AI_API_BASE_URL__,
    '/suggest-categories',
    {
      method: 'POST',
      body,
      headers: {
        'X-Gachi-AI-Key': credentials.apiKey,
        'X-Gachi-AI-Provider': credentials.provider,
      },
      ...(signal ? { signal } : {}),
    },
  ).then(toAiSuggestion);

  cacheAiSuggestion(item.id, item.version, credentials.provider, suggestion);
  return suggestion;
};
