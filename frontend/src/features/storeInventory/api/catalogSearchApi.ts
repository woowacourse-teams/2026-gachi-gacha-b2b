import { requestFrom } from '@/apis/httpClient';
import type { BackendGachaDto } from '@/features/classification/api/classification.dto';
import { getCategories } from '@/features/classification/api/classificationApi';
import {
  createCategoryIdByName,
  toBackendClassificationItem,
} from '@/features/classification/api/toClassification';
import type {
  CatalogMetadata,
  CatalogMetadataStatus,
  ClassificationItem,
  ClassificationQueue,
} from '@/features/classification/model/classification';

interface CatalogGachaDto extends BackendGachaDto {
  metadata?: CatalogMetadata;
}

interface CatalogSearchResponseDto {
  items: CatalogGachaDto[];
  totalCount: number;
  nextCursor: number | null;
  metadataStatus?: CatalogMetadataStatus;
  metadataAsOf?: string | null;
}

interface CatalogItemsResponseDto {
  items: CatalogGachaDto[];
  metadataStatus?: CatalogMetadataStatus;
  metadataAsOf?: string | null;
}

export interface CatalogItemsResult {
  items: ClassificationItem[];
  metadataStatus: CatalogMetadataStatus;
  metadataAsOf: string | null;
}

const LOOKUP_BATCH_SIZE = 100;

const toCatalogItem = (
  item: CatalogGachaDto,
  categoryIdsByName: ReadonlyMap<string, number>,
): ClassificationItem => {
  const mapped = toBackendClassificationItem(item, categoryIdsByName);
  return item.metadata ? { ...mapped, metadata: item.metadata } : mapped;
};

export const getCatalogItemsByIds = async (
  gachaIds: number[],
): Promise<CatalogItemsResult> => {
  if (gachaIds.length === 0) {
    return { items: [], metadataStatus: 'disabled', metadataAsOf: null };
  }

  const categories = await getCategories();
  const categoryIdsByName = createCategoryIdByName(categories);
  const items: CatalogGachaDto[] = [];
  const statuses: CatalogMetadataStatus[] = [];
  const asOfValues = new Set<string>();

  for (let offset = 0; offset < gachaIds.length; offset += LOOKUP_BATCH_SIZE) {
    const searchParams = new URLSearchParams();
    gachaIds.slice(offset, offset + LOOKUP_BATCH_SIZE).forEach((id) => {
      searchParams.append('gachaId', String(id));
    });
    const response = await requestFrom<CatalogItemsResponseDto>(
      __BFF_API_BASE_URL__,
      `/catalog-items?${searchParams.toString()}`,
    );
    items.push(...response.items);
    statuses.push(response.metadataStatus ?? 'disabled');
    if (response.metadataAsOf) asOfValues.add(response.metadataAsOf);
  }

  const metadataStatus: CatalogMetadataStatus = statuses.includes('unavailable')
    ? 'unavailable'
    : statuses.includes('stale') || asOfValues.size > 1
      ? 'stale'
      : statuses.includes('fresh')
        ? 'fresh'
        : 'disabled';
  return {
    items: items.map((item) => toCatalogItem(item, categoryIdsByName)),
    metadataStatus,
    metadataAsOf: asOfValues.size === 1 ? ([...asOfValues][0] ?? null) : null,
  };
};

export const searchAssignableGachaCatalog = async ({
  query,
  categoryIds,
  cursor = 0,
  limit = 50,
}: {
  query: string;
  categoryIds: number[];
  cursor?: number;
  limit?: number;
}): Promise<ClassificationQueue> => {
  const categories = await getCategories();
  const categoryNameById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const selectedCategoryNames = categoryIds.flatMap((categoryId) => {
    const categoryName = categoryNameById.get(categoryId);
    return categoryName === undefined ? [] : [categoryName];
  });

  if (categoryIds.length > 0 && selectedCategoryNames.length === 0) {
    return {
      items: [],
      totalCount: 0,
      skippedCount: 0,
      filteredCount: 0,
      nextCursor: null,
    };
  }

  const searchParams = new URLSearchParams({
    cursor: String(cursor),
    limit: String(limit),
  });
  if (query.trim()) searchParams.set('query', query.trim());
  selectedCategoryNames.forEach((categoryName) => {
    searchParams.append('category', categoryName);
  });

  const dto = await requestFrom<CatalogSearchResponseDto>(
    __BFF_API_BASE_URL__,
    `/catalog-search?${searchParams.toString()}`,
  );
  const categoryIdsByName = createCategoryIdByName(categories);

  return {
    items: dto.items.map((item) => toCatalogItem(item, categoryIdsByName)),
    totalCount: dto.totalCount,
    skippedCount: 0,
    filteredCount: dto.totalCount,
    nextCursor: dto.nextCursor,
    metadataStatus: dto.metadataStatus ?? 'disabled',
    metadataAsOf: dto.metadataAsOf ?? null,
  };
};
