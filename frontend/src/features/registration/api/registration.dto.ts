import type { ClassificationItemDto } from '@/features/classification/api/classification.dto';

export interface CreateUploadUrlRequestDto {
  originalFileName: string;
  contentType: string;
  contentLength: number;
}

export interface FieldImageUploadTicketDto {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
  expiresAt: string;
}

export interface CreateFieldGachaRequestDto {
  objectKey: string;
  originalFileName: string;
  name: string;
  categoryIds: number[];
  source: 'FIELD';
}

export interface CreateFieldGachaResponseDto {
  item: ClassificationItemDto;
}

export interface BackendCreateGachaRequestDto {
  name: string;
  caption: null;
  thumbnailUrl: null;
  categories: string[];
}
