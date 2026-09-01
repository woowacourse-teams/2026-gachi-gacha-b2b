import { requestFrom } from '@/apis/httpClient';

import type {
  AiCategorySuggestionDto,
  AiCategorySuggestionRequestDto,
} from './aiSuggestion.dto';
import { cacheAiSuggestion, getCachedAiSuggestion } from './aiSuggestionCache';
import type { AiCategorySuggestion } from '../model/aiSuggestion';
import type { Category, ClassificationItem } from '../model/classification';

const inFlightRequests = new Map<string, Promise<AiCategorySuggestion>>();

const getRequestKey = (item: ClassificationItem) =>
  `${item.id}:${item.version}`;

const toAiSuggestion = (
  dto: AiCategorySuggestionDto,
): AiCategorySuggestion => ({
  categoryNames: dto.categoryNames,
  model: dto.model,
  generatedAt: dto.generatedAt,
});

export const getAiCategorySuggestion = async (
  item: ClassificationItem,
  categories: Category[],
  force = false,
): Promise<AiCategorySuggestion> => {
  if (!force) {
    const cachedSuggestion = getCachedAiSuggestion(item.id, item.version);
    if (cachedSuggestion) return cachedSuggestion;
  }

  const requestKey = getRequestKey(item);
  const pendingRequest = inFlightRequests.get(requestKey);
  if (pendingRequest) return pendingRequest;

  const body: AiCategorySuggestionRequestDto = {
    itemId: item.id,
    itemVersion: item.version,
    imageUrl: item.imageUrl,
    name: item.name,
    allowedCategoryNames: categories.map(({ name }) => name),
  };
  const request = requestFrom<AiCategorySuggestionDto>(
    __AI_API_BASE_URL__,
    '/suggest-categories',
    { method: 'POST', body },
  )
    .then(toAiSuggestion)
    .then((suggestion) => {
      cacheAiSuggestion(item.id, item.version, suggestion);
      return suggestion;
    })
    .finally(() => inFlightRequests.delete(requestKey));

  inFlightRequests.set(requestKey, request);
  return request;
};
