import type {
  Category,
  ClassificationItem,
} from '@/features/classification/model/classification';

export const MAX_FIELD_IMAGE_SIZE = 10 * 1024 * 1024;

export const SUPPORTED_FIELD_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export interface FieldGachaDraft {
  name: string;
  categoryIds: number[];
}

export interface FieldImageUploadTicket {
  uploadUrl: string;
  objectKey: string;
  headers: Record<string, string>;
  expiresAt: string;
}

export interface FieldGachaRegistration {
  file: File;
  objectKey: string;
  draft: FieldGachaDraft;
}

export type RegistrationStage =
  'IDLE' | 'PREPARING_UPLOAD' | 'UPLOADING_IMAGE' | 'SAVING_DATA';

export interface RegistrationResult {
  item: ClassificationItem;
  warning?: string;
}

export interface BackendFieldGachaRegistration {
  file: File;
  draft: FieldGachaDraft;
  categories: Category[];
}

export const validateFieldImage = (file: File): string | null => {
  if (
    !SUPPORTED_FIELD_IMAGE_TYPES.includes(
      file.type as (typeof SUPPORTED_FIELD_IMAGE_TYPES)[number],
    )
  ) {
    return 'JPG, PNG, WebP 형식의 이미지만 등록할 수 있습니다.';
  }

  if (file.size === 0) {
    return '내용이 없는 파일은 등록할 수 없습니다.';
  }

  if (file.size > MAX_FIELD_IMAGE_SIZE) {
    return '이미지는 10MB 이하로 등록해 주세요.';
  }

  return null;
};
