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
  SourceFolderDto,
} from './classification.dto';
import {
  toCategory,
  toClassificationItem,
  toClassificationQueue,
  toClassificationResult,
  toSourceFolder,
} from './toClassification';
import type {
  Category,
  ClassificationDraft,
  ClassificationItem,
  ClassificationResult,
  ClassificationStatus,
  SourceFolder,
} from '../model/classification';

export interface QueueQuery {
  status: ClassificationStatus;
  query: string;
  source?: string;
}

export const getClassificationQueue = async ({
  status,
  query,
  source,
}: QueueQuery) => {
  const searchParams = new URLSearchParams({ status });

  if (query.trim()) {
    searchParams.set('query', query.trim());
  }

  if (source) {
    searchParams.set('source', source);
  }

  const dto = await request<ClassificationQueueDto>(
    `/classifications?${searchParams.toString()}`,
  );

  return toClassificationQueue(dto);
};

export const getSourceFolders = async (): Promise<SourceFolder[]> => {
  const dtos = await request<SourceFolderDto[]>('/sources');

  return dtos.map(toSourceFolder);
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
): Promise<ClassificationResult> => {
  const body: ClassifyGachaRequestDto = {
    name: draft.name.trim(),
    categoryIds: draft.categoryIds,
    version: item.version,
  };
  const dto = await request<ClassificationResultDto>(
    `/classifications/${item.id}/classify`,
    { method: 'PUT', body },
  );

  return toClassificationResult(dto);
};

export const skipGacha = async (
  item: ClassificationItem,
  reason: string,
): Promise<ClassificationResult> => {
  const body: SkipGachaRequestDto = {
    reason: reason.trim(),
    version: item.version,
  };
  const dto = await request<ClassificationResultDto>(
    `/classifications/${item.id}/skip`,
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
