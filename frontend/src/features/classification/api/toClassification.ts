import type {
  BackendCategoryDto,
  BackendGachaDto,
  CategoryDto,
  ClassificationItemDto,
  ClassificationQueueDto,
  ClassificationResultDto,
} from './classification.dto';
import type {
  Category,
  ClassificationItem,
  ClassificationQueue,
  ClassificationResult,
} from '../model/classification';

export const toCategory = (dto: CategoryDto): Category => ({
  id: dto.categoryId,
  name: dto.categoryName,
});

export const toClassificationItem = (
  dto: ClassificationItemDto,
): ClassificationItem => ({
  id: dto.gachaId,
  imageUrl: dto.thumbnailUrl,
  name: dto.displayName ?? '',
  originalFileName: dto.originalFileName,
  source: dto.source,
  locationLabel: dto.location,
  description: dto.caption ?? '',
  categoryIds: dto.categoryIds,
  status: dto.status,
  version: dto.version,
  createdAt: dto.createdAt,
});

export const toClassificationQueue = (
  dto: ClassificationQueueDto,
): ClassificationQueue => ({
  items: dto.items.map(toClassificationItem),
  totalCount: dto.totalCount,
  skippedCount: dto.skippedCount,
  filteredCount: dto.filteredCount,
  nextCursor: dto.nextCursor,
});

export const toClassificationResult = (
  dto: ClassificationResultDto,
): ClassificationResult => ({
  nextItemId: dto.nextGachaId,
});

export const toBackendCategory = (dto: BackendCategoryDto): Category => ({
  id: dto.categoryId,
  name: dto.name,
});

export type CategoryIdByName = ReadonlyMap<string, number>;

export const createCategoryIdByName = (
  categories: Category[],
): CategoryIdByName =>
  new Map(categories.map((category) => [category.name, category.id]));

export const toBackendClassificationItem = (
  dto: BackendGachaDto,
  categoriesOrLookup: Category[] | CategoryIdByName,
): ClassificationItem => {
  const categoryIdsByName = Array.isArray(categoriesOrLookup)
    ? createCategoryIdByName(categoriesOrLookup)
    : categoriesOrLookup;
  const categoryIds = dto.categories.flatMap((categoryName) => {
    const categoryId = categoryIdsByName.get(categoryName);
    return categoryId === undefined ? [] : [categoryId];
  });
  const version = Date.parse(dto.updatedAt);

  return {
    id: dto.gachaId,
    imageUrl: dto.thumbnailUrl ?? '',
    name: dto.name ?? '',
    originalFileName: dto.productCode ?? `gacha-${dto.gachaId}`,
    source: dto.source,
    locationLabel: '위치 정보 없음',
    description: dto.caption ?? '',
    categoryIds,
    status: categoryIds.length > 0 ? 'CLASSIFIED' : 'UNCLASSIFIED',
    version: Number.isSafeInteger(version) && version >= 0 ? version : 0,
    createdAt: dto.createdAt,
  };
};
