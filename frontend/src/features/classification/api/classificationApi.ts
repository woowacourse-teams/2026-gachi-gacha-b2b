import { request } from '@/apis/httpClient';

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
  ClassificationStatus,
} from '../model/classification';

export interface QueueQuery {
  status: ClassificationStatus;
  query: string;
  minId?: number;
  maxId?: number;
  categoryIds?: number[];
}

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
}: QueueQuery) => {
  const searchParams = new URLSearchParams({ status });

  if (query.trim()) {
    searchParams.set('query', query.trim());
  }

  appendIdRange(searchParams, minId, maxId);

  if (categoryIds.length > 0) {
    searchParams.set('categoryIds', categoryIds.join(','));
  }

  const dto = await request<ClassificationQueueDto>(
    `/classifications?${searchParams.toString()}`,
  );

  return toClassificationQueue(dto);
};

export const getClassificationItem = async (
  itemId: number,
): Promise<ClassificationItem> => {
  const dto = await request<ClassificationItemDto>(
    `/classifications/${itemId}`,
  );

  return toClassificationItem(dto);
};

export const getCategories = async (): Promise<Category[]> => {
  const dtos = await request<CategoryDto[]>('/categories');

  return dtos.map(toCategory);
};

export const createCategory = async (name: string): Promise<Category> => {
  const body: CreateCategoryRequestDto = { name };
  const dto = await request<CategoryDto>('/categories', {
    method: 'POST',
    body,
  });

  return toCategory(dto);
};

export const deleteCategory = async (categoryId: number): Promise<void> => {
  await request<void>(`/categories/${categoryId}`, { method: 'DELETE' });
};

export const classifyGacha = async (
  item: ClassificationItem,
  draft: ClassificationDraft,
  idRange: ClassificationIdRange = {},
): Promise<ClassificationResult> => {
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
  const body: RestoreGachaRequestDto = { version: item.version };

  await request<ClassificationItemDto>(`/classifications/${item.id}/restore`, {
    method: 'POST',
    body,
  });
};
