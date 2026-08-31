import type {
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
  sourceLabel: dto.source,
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
});

export const toClassificationResult = (
  dto: ClassificationResultDto,
): ClassificationResult => ({
  nextItemId: dto.nextGachaId,
});
