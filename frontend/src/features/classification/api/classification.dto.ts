import type { ClassificationStatus } from '../model/classification';

export interface CategoryDto {
  categoryId: number;
  categoryName: string;
}

export interface ClassificationItemDto {
  gachaId: number;
  thumbnailUrl: string;
  displayName: string | null;
  originalFileName: string;
  source: string;
  caption: string | null;
  categoryIds: number[];
  status: ClassificationStatus;
  version: number;
  createdAt: string;
}

export interface ClassificationQueueDto {
  items: ClassificationItemDto[];
  totalCount: number;
  skippedCount: number;
}

export interface ClassificationResultDto {
  nextGachaId: number | null;
}

export interface ClassifyGachaRequestDto {
  name: string;
  categoryIds: number[];
  version: number;
}

export interface SkipGachaRequestDto {
  reason: string;
  version: number;
}

export interface RestoreGachaRequestDto {
  version: number;
}

export interface CreateCategoryRequestDto {
  name: string;
}
