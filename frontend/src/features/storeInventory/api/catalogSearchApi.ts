import { requestFrom } from '@/apis/httpClient';
import type { BackendGachaDto } from '@/features/classification/api/classification.dto';
import { getCategories } from '@/features/classification/api/classificationApi';
import {
  createCategoryIdByName,
  toBackendClassificationItem,
} from '@/features/classification/api/toClassification';
import type { ClassificationQueue } from '@/features/classification/model/classification';

interface CatalogSearchResponseDto {
  items: BackendGachaDto[];
  totalCount: number;
  nextCursor: number | null;
}

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
    __AI_API_BASE_URL__,
    `/catalog-search?${searchParams.toString()}`,
  );
  const categoryIdsByName = createCategoryIdByName(categories);

  return {
    items: dto.items.map((item) =>
      toBackendClassificationItem(item, categoryIdsByName),
    ),
    totalCount: dto.totalCount,
    skippedCount: 0,
    filteredCount: dto.totalCount,
    nextCursor: dto.nextCursor,
  };
};
