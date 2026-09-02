import { ApiError, requestData } from '@/apis/httpClient';

import type {
  BackendCategoryDto,
  BackendGachaDto,
  BackendGachaUpdateRequestDto,
  BackendGachaUpdateResponseDto,
  BackendPageDto,
} from './classification.dto';
import {
  createCategoryIdByName,
  toBackendCategory,
  toBackendClassificationItem,
} from './toClassification';
import type {
  Category,
  ClassificationDraft,
  ClassificationIdRange,
  ClassificationItem,
  ClassificationQueue,
  ClassificationResult,
  QueueQuery,
} from '../model/classification';

const CATEGORY_CACHE_TTL_MS = 60_000;

let categoryCache: { categories: Category[]; expiresAt: number } | null = null;
let categoryRequest: Promise<Category[]> | null = null;

export const invalidateBackendCategoryCache = () => {
  categoryCache = null;
  categoryRequest = null;
};

const getBackendCategories = async (): Promise<Category[]> => {
  if (categoryCache && categoryCache.expiresAt > Date.now()) {
    return categoryCache.categories;
  }

  if (categoryRequest) return categoryRequest;

  categoryRequest = requestData<BackendCategoryDto[]>('/categories')
    .then((categories) => categories.map(toBackendCategory))
    .then((categories) => {
      categoryCache = {
        categories,
        expiresAt: Date.now() + CATEGORY_CACHE_TTL_MS,
      };
      return categories;
    })
    .finally(() => {
      categoryRequest = null;
    });

  return categoryRequest;
};

const matchesStatus = (
  item: ClassificationItem,
  status: QueueQuery['status'],
) => item.status === status;

export const getBackendClassificationQueue = async ({
  status,
  query,
  minId,
  maxId,
  categoryIds = [],
  cursor = 0,
  limit = 50,
  signal,
}: QueueQuery): Promise<ClassificationQueue> => {
  if (status === 'SKIPPED') {
    return {
      items: [],
      totalCount: 0,
      skippedCount: 0,
      filteredCount: 0,
      nextCursor: null,
    };
  }

  const categories = await getBackendCategories();
  const categoryIdsByName = createCategoryIdByName(categories);
  let pageNumber = cursor;

  while (true) {
    const searchParams = new URLSearchParams({
      page: String(pageNumber),
      size: String(limit),
      sort: 'id,asc',
    });
    if (query.trim()) searchParams.set('keyword', query.trim());

    const page = await requestData<BackendPageDto<BackendGachaDto>>(
      `/gachas?${searchParams.toString()}`,
      signal ? { signal } : {},
    );
    const items = page.content
      .map((item) => toBackendClassificationItem(item, categoryIdsByName))
      .filter(
        (item) =>
          matchesStatus(item, status) &&
          (minId === undefined || item.id >= minId) &&
          (maxId === undefined || item.id <= maxId) &&
          (categoryIds.length === 0 ||
            categoryIds.some((categoryId) =>
              item.categoryIds.includes(categoryId),
            )),
      );

    if (items.length > 0 || page.last) {
      return {
        items,
        totalCount: page.totalElements,
        skippedCount: 0,
        filteredCount: page.totalElements,
        nextCursor: page.last ? null : page.number + 1,
      };
    }

    pageNumber = page.number + 1;
  }
};

export const getBackendClassificationItem = async (
  itemId: number,
): Promise<ClassificationItem> => {
  const [item, categories] = await Promise.all([
    requestData<BackendGachaDto>(`/gachas/${itemId}`),
    getBackendCategories(),
  ]);
  return toBackendClassificationItem(item, categories);
};

export const updateBackendGachaClassification = async (
  item: ClassificationItem,
  draft: ClassificationDraft,
): Promise<void> => {
  const body: BackendGachaUpdateRequestDto = {
    name: draft.name.trim(),
    categories: draft.categoryIds,
  };

  await requestData<BackendGachaUpdateResponseDto>(`/gachas/${item.id}`, {
    method: 'PATCH',
    body,
  });
};

const findNextUnclassifiedItemId = async (
  currentItemId: number,
  idRange: ClassificationIdRange,
) => {
  let cursor: number | undefined = 0;

  while (cursor !== undefined) {
    const queue = await getBackendClassificationQueue({
      status: 'UNCLASSIFIED',
      query: '',
      minId: Math.max(currentItemId + 1, idRange.minId ?? 1),
      ...(idRange.maxId === undefined ? {} : { maxId: idRange.maxId }),
      cursor,
      limit: 100,
    });
    const nextItem = queue.items[0];
    if (nextItem) return nextItem.id;
    cursor = queue.nextCursor ?? undefined;
  }

  return null;
};

export const classifyBackendGacha = async (
  item: ClassificationItem,
  draft: ClassificationDraft,
  idRange: ClassificationIdRange = {},
): Promise<ClassificationResult> => {
  await updateBackendGachaClassification(item, draft);

  return {
    nextItemId: await findNextUnclassifiedItemId(item.id, idRange),
  };
};

export const createBackendCategory = async (
  name: string,
): Promise<Category> => {
  const category = await requestData<BackendCategoryDto>('/categories', {
    method: 'POST',
    body: { name },
  });
  invalidateBackendCategoryCache();
  return toBackendCategory(category);
};

export const deleteBackendCategory = async (
  categoryId: number,
): Promise<void> => {
  await requestData<{ categoryId: number }>(`/categories/${categoryId}`, {
    method: 'DELETE',
  });
  invalidateBackendCategoryCache();
};

export const unsupportedBackendSkip = (): never => {
  throw new ApiError(
    '현재 백엔드에는 복구 가능한 건너뛰기 상태 API가 없습니다.',
    501,
  );
};

export { getBackendCategories };
