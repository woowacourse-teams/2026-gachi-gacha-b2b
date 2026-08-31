import { ApiError, request } from '@/apis/httpClient';
import { toClassificationItem } from '@/features/classification/api/toClassification';

import type {
  CreateFieldGachaRequestDto,
  CreateFieldGachaResponseDto,
  CreateUploadUrlRequestDto,
  FieldImageUploadTicketDto,
} from './registration.dto';
import type {
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
