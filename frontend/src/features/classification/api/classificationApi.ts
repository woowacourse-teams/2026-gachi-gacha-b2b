import { request } from '@/apis/httpClient';

import {
  classifyBackendGacha,
  createBackendCategory,
  deleteBackendCategory,
  getBackendCategories,
  getBackendClassificationItem,
  getBackendClassificationQueue,
  unsupportedBackendSkip,
} from './backendClassificationApi';
import type {
  CategoryDto,
  ClassificationItemDto,
  ClassificationQueueDto,
  ClassificationResultDto,
  ClassifyGachaRequestDto,
  CreateCategoryRequestDto,
  RestoreGachaRequestDto,
  SkipGachaRequestDto,
} from './classification.dto';
import {
  toCategory,
  toClassificationItem,
  toClassificationQueue,
  toClassificationResult,
} from './toClassification';
import type {
  Category,
  ClassificationDraft,
  ClassificationIdRange,
  ClassificationItem,
  ClassificationResult,
  QueueQuery,
} from '../model/classification';

const appendIdRange = (
  searchParams: URLSearchParams,
  minId?: number,
  maxId?: number,
) => {
  if (minId !== undefined) searchParams.set('minId', String(minId));
  if (maxId !== undefined) searchParams.set('maxId', String(maxId));
};

export const getClassificationQueue = async ({
  status,
  query,
  minId,
  maxId,
  categoryIds = [],
  cursor,
  limit = 50,
}: QueueQuery) => {
  if (!__USE_MOCK_API__) {
    return getBackendClassificationQueue({
      status,
      query,
      ...(minId === undefined ? {} : { minId }),
      ...(maxId === undefined ? {} : { maxId }),
      ...(categoryIds.length === 0 ? {} : { categoryIds }),
      ...(cursor === undefined ? {} : { cursor }),
      limit,
    });
  }

  const searchParams = new URLSearchParams({ status, limit: String(limit) });

  if (query.trim()) {
    searchParams.set('query', query.trim());
  }

  appendIdRange(searchParams, minId, maxId);

  if (categoryIds.length > 0) {
    searchParams.set('categoryIds', categoryIds.join(','));
  }

  if (cursor !== undefined) {
    searchParams.set('cursor', String(cursor));
  }

  const dto = await request<ClassificationQueueDto>(
    `/classifications?${searchParams.toString()}`,
  );

  return toClassificationQueue(dto);
};

export const getClassificationItem = async (
  itemId: number,
): Promise<ClassificationItem> => {
  if (!__USE_MOCK_API__) return getBackendClassificationItem(itemId);

  const dto = await request<ClassificationItemDto>(
    `/classifications/${itemId}`,
  );

  return toClassificationItem(dto);
};

export const getCategories = async (): Promise<Category[]> => {
  if (!__USE_MOCK_API__) return getBackendCategories();

  const dtos = await request<CategoryDto[]>('/categories');

  return dtos.map(toCategory);
};

export const createCategory = async (name: string): Promise<Category> => {
  if (!__USE_MOCK_API__) return createBackendCategory(name);

  const body: CreateCategoryRequestDto = { name };
  const dto = await request<CategoryDto>('/categories', {
    method: 'POST',
    body,
  });

  return toCategory(dto);
};

export const deleteCategory = async (categoryId: number): Promise<void> => {
  if (!__USE_MOCK_API__) return deleteBackendCategory(categoryId);

  await request<void>(`/categories/${categoryId}`, { method: 'DELETE' });
};

export const classifyGacha = async (
  item: ClassificationItem,
  draft: ClassificationDraft,
  idRange: ClassificationIdRange = {},
): Promise<ClassificationResult> => {
  if (!__USE_MOCK_API__) {
    return classifyBackendGacha(item, draft, idRange);
  }

  const body: ClassifyGachaRequestDto = {
    name: draft.name.trim(),
    categoryIds: draft.categoryIds,
    version: item.version,
  };
  const searchParams = new URLSearchParams();
  appendIdRange(searchParams, idRange.minId, idRange.maxId);
  const query = searchParams.size ? `?${searchParams.toString()}` : '';
  const dto = await request<ClassificationResultDto>(
    `/classifications/${item.id}/classify${query}`,
    { method: 'PUT', body },
  );

  return toClassificationResult(dto);
};

export const skipGacha = async (
  item: ClassificationItem,
  reason: string,
  idRange: ClassificationIdRange = {},
): Promise<ClassificationResult> => {
  if (!__USE_MOCK_API__) return unsupportedBackendSkip();

  const body: SkipGachaRequestDto = {
    reason: reason.trim(),
    version: item.version,
  };
  const searchParams = new URLSearchParams();
  appendIdRange(searchParams, idRange.minId, idRange.maxId);
  const query = searchParams.size ? `?${searchParams.toString()}` : '';
  const dto = await request<ClassificationResultDto>(
    `/classifications/${item.id}/skip${query}`,
    { method: 'POST', body },
  );

  return toClassificationResult(dto);
};

export const restoreGacha = async (item: ClassificationItem): Promise<void> => {
  if (!__USE_MOCK_API__) return unsupportedBackendSkip();

  const body: RestoreGachaRequestDto = { version: item.version };

  await request<ClassificationItemDto>(`/classifications/${item.id}/restore`, {
    method: 'POST',
    body,
  });
};
