import { ApiError, request, requestData } from '@/apis/httpClient';
import type { BackendGachaDto } from '@/features/classification/api/classification.dto';
import {
  toBackendClassificationItem,
  toClassificationItem,
} from '@/features/classification/api/toClassification';

import type {
  CreateFieldGachaRequestDto,
  CreateFieldGachaResponseDto,
  BackendCreateGachaRequestDto,
  CreateUploadUrlRequestDto,
  FieldImageUploadTicketDto,
} from './registration.dto';
import type {
  BackendFieldGachaRegistration,
  FieldGachaRegistration,
  FieldImageUploadTicket,
  RegistrationResult,
} from '../model/registration';

export const createFieldImageUploadTicket = async (
  file: File,
): Promise<FieldImageUploadTicket> => {
  const body: CreateUploadUrlRequestDto = {
    originalFileName: file.name,
    contentType: file.type,
    contentLength: file.size,
  };

  return request<FieldImageUploadTicketDto>('/gachas/upload-url', {
    method: 'POST',
    body,
  });
};

export const uploadFieldImage = async (
  file: File,
  ticket: FieldImageUploadTicket,
): Promise<void> => {
  const content = await file.arrayBuffer();
  const response = await fetch(ticket.uploadUrl, {
    method: 'PUT',
    body: content,
    headers: ticket.headers,
  });

  if (!response.ok) {
    const responseBody: unknown = await response.json().catch(() => null);
    const message =
      typeof responseBody === 'object' &&
      responseBody !== null &&
      'message' in responseBody
        ? String(responseBody.message)
        : '이미지를 업로드하지 못했습니다.';

    throw new ApiError(message, response.status);
  }
};

export const createFieldGacha = async ({
  file,
  objectKey,
  draft,
}: FieldGachaRegistration): Promise<RegistrationResult> => {
  const body: CreateFieldGachaRequestDto = {
    objectKey,
    originalFileName: file.name,
    name: draft.name.trim(),
    categoryIds: draft.categoryIds,
    source: 'FIELD',
  };
  const dto = await request<CreateFieldGachaResponseDto>('/gachas', {
    method: 'POST',
    body,
  });

  return { item: toClassificationItem(dto.item) };
};

export const createBackendFieldGacha = async ({
  file,
  draft,
  categories,
}: BackendFieldGachaRegistration): Promise<RegistrationResult> => {
  const categoryNamesById = new Map(
    categories.map((category) => [category.id, category.name]),
  );
  const categoryNames = draft.categoryIds.flatMap((categoryId) => {
    const categoryName = categoryNamesById.get(categoryId);
    return categoryName === undefined ? [] : [categoryName];
  });
  const body: BackendCreateGachaRequestDto = {
    name: draft.name.trim(),
    caption: null,
    thumbnailUrl: null,
    categories: categoryNames,
  };
  const createdGacha = await requestData<BackendGachaDto>('/gachas', {
    method: 'POST',
    body,
  });
  const formData = new FormData();
  formData.set('image', file);

  try {
    const savedGacha = await requestData<BackendGachaDto>(
      `/gachas/${createdGacha.gachaId}/thumbnail`,
      { method: 'PUT', formData },
    );
    return { item: toBackendClassificationItem(savedGacha, categories) };
  } catch {
    return {
      item: toBackendClassificationItem(createdGacha, categories),
      warning:
        '가챠 정보는 저장됐지만 이미지 업로드에 실패했습니다. 같은 가챠를 다시 등록하지 말고 백엔드에서 썸네일을 추가해 주세요.',
    };
  }
};
