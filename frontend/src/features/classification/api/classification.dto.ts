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
  location: string;
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
  filteredCount: number;
  nextCursor: number | null;
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

export interface BackendCategoryDto {
  categoryId: number;
  name: string;
}

export interface BackendGachaDto {
  gachaId: number;
  name: string | null;
  caption: string | null;
  thumbnailUrl: string | null;
  productCode: string | null;
  categories: string[];
  source: string;
  createdAt: string;
  updatedAt: string;
}

export interface BackendPageDto<Item> {
  content: Item[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface BackendGachaUpdateRequestDto {
  name: string;
  categories: number[];
}

export interface BackendGachaUpdateResponseDto {
  gachaId: number;
  updatedAt: string;
}
