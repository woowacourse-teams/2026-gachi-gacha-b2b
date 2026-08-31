import { delay, http, HttpResponse } from 'msw';

import { normalizeCategoryName } from '@/features/classification/model/category';
import type { ClassificationStatus } from '@/features/classification/model/classification';
import {
  MAX_FIELD_IMAGE_SIZE,
  SUPPORTED_FIELD_IMAGE_TYPES,
} from '@/features/registration/model/registration';

import {
  categories,
  classificationItems,
  createMockFieldUpload,
  fieldUploads,
} from './data';
import type {
  CategoryDto,
  ClassifyGachaRequestDto,
  CreateCategoryRequestDto,
  RestoreGachaRequestDto,
  SkipGachaRequestDto,
} from '../features/classification/api/classification.dto';
import type {
  CreateFieldGachaRequestDto,
  CreateUploadUrlRequestDto,
} from '../features/registration/api/registration.dto';

const apiPath = (path: string) => `${__API_BASE_URL__}${path}`;

const toAbsoluteApiUrl = (requestUrl: string, path: string) =>
  new URL(apiPath(path), requestUrl).toString();

const isStatus = (value: string | null): value is ClassificationStatus =>
  value === 'UNCLASSIFIED' || value === 'CLASSIFIED' || value === 'SKIPPED';

const findItem = (itemId: number) =>
  classificationItems.find((item) => item.gachaId === itemId);

const toOptionalId = (value: string | null) => {
  const parsed = value ? Number(value) : undefined;
  return parsed !== undefined && Number.isSafeInteger(parsed) && parsed > 0
    ? parsed
    : undefined;
};

const getIdRange = (url: URL) => ({
  minId: toOptionalId(url.searchParams.get('minId')),
  maxId: toOptionalId(url.searchParams.get('maxId')),
});

const getCategoryIds = (url: URL) => {
  const values = url.searchParams
    .getAll('categoryIds')
    .flatMap((value) => value.split(','));

  return [
    ...new Set(
      values
        .map(Number)
        .filter((value) => Number.isSafeInteger(value) && value > 0),
    ),
  ];
};

const isInIdRange = (
  itemId: number,
  minId: number | undefined,
  maxId: number | undefined,
) =>
  (minId === undefined || itemId >= minId) &&
  (maxId === undefined || itemId <= maxId);

const getNextItemId = (
  currentItemId: number,
  minId: number | undefined,
  maxId: number | undefined,
) => {
  const candidates = classificationItems
    .filter(
      (item) =>
        item.status === 'UNCLASSIFIED' &&
        item.gachaId > currentItemId &&
        isInIdRange(item.gachaId, minId, maxId),
    )
    .sort((left, right) => left.gachaId - right.gachaId);

  return candidates[0]?.gachaId ?? null;
};

const conflict = () =>
  HttpResponse.json(
    { message: '다른 작업자가 먼저 변경했습니다. 목록을 새로고침해 주세요.' },
    { status: 409 },
  );

export const handlers = [
  http.get(apiPath('/classifications'), async ({ request }) => {
    await delay(250);

    const url = new URL(request.url);
    const requestedStatus = url.searchParams.get('status');
    const status = isStatus(requestedStatus) ? requestedStatus : 'UNCLASSIFIED';
    const query = url.searchParams
      .get('query')
      ?.trim()
      .toLocaleLowerCase('ko-KR');
    const { minId, maxId } = getIdRange(url);
    const categoryIds = getCategoryIds(url);
    const statusItems = classificationItems
      .filter(
        (item) =>
          item.status === status &&
          isInIdRange(item.gachaId, minId, maxId) &&
          (categoryIds.length === 0 ||
            categoryIds.some((categoryId) =>
              item.categoryIds.includes(categoryId),
            )),
      )
      .sort((left, right) => left.gachaId - right.gachaId);
    const items = query
      ? statusItems.filter((item) =>
          [item.displayName, item.caption, item.source, item.location].some(
            (value) => value?.toLocaleLowerCase('ko-KR').includes(query),
          ),
        )
      : statusItems;

    return HttpResponse.json({
      items,
      totalCount: classificationItems.filter(
        (item) => item.status === 'UNCLASSIFIED',
      ).length,
      skippedCount: classificationItems.filter(
        (item) => item.status === 'SKIPPED',
      ).length,
    });
  }),

  http.get(apiPath('/classifications/:itemId'), async ({ params }) => {
    await delay(180);

    const item = findItem(Number(params.itemId));

    if (!item) {
      return HttpResponse.json(
        { message: '분류 데이터를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    return HttpResponse.json(item);
  }),

  http.put(
    apiPath('/classifications/:itemId/classify'),
    async ({ params, request }) => {
      await delay(300);

      const { minId, maxId } = getIdRange(new URL(request.url));
      const item = findItem(Number(params.itemId));
      const body = (await request.json()) as ClassifyGachaRequestDto;

      if (!item) {
        return HttpResponse.json(
          { message: '분류 데이터를 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      if (item.version !== body.version) {
        return conflict();
      }

      if (!body.name.trim() || body.categoryIds.length === 0) {
        return HttpResponse.json(
          { message: '이름과 카테고리를 모두 입력해 주세요.' },
          { status: 400 },
        );
      }

      const hasUnknownCategory = body.categoryIds.some(
        (categoryId) =>
          !categories.some((category) => category.categoryId === categoryId),
      );

      if (hasUnknownCategory) {
        return HttpResponse.json(
          { message: '존재하지 않는 카테고리가 포함되어 있습니다.' },
          { status: 400 },
        );
      }

      item.displayName = body.name.trim();
      item.categoryIds = [...new Set(body.categoryIds)];
      item.status = 'CLASSIFIED';
      item.version += 1;

      return HttpResponse.json({
        nextGachaId: getNextItemId(item.gachaId, minId, maxId),
      });
    },
  ),

  http.post(
    apiPath('/classifications/:itemId/skip'),
    async ({ params, request }) => {
      await delay(250);

      const { minId, maxId } = getIdRange(new URL(request.url));
      const item = findItem(Number(params.itemId));
      const body = (await request.json()) as SkipGachaRequestDto;

      if (!item) {
        return HttpResponse.json(
          { message: '분류 데이터를 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      if (item.version !== body.version) {
        return conflict();
      }

      if (!body.reason.trim()) {
        return HttpResponse.json(
          { message: '건너뛰는 이유를 입력해 주세요.' },
          { status: 400 },
        );
      }

      item.status = 'SKIPPED';
      item.version += 1;

      return HttpResponse.json({
        nextGachaId: getNextItemId(item.gachaId, minId, maxId),
      });
    },
  ),

  http.post(
    apiPath('/classifications/:itemId/restore'),
    async ({ params, request }) => {
      await delay(200);

      const item = findItem(Number(params.itemId));
      const body = (await request.json()) as RestoreGachaRequestDto;

      if (!item) {
        return HttpResponse.json(
          { message: '분류 데이터를 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      if (item.version !== body.version) {
        return conflict();
      }

      item.status = 'UNCLASSIFIED';
      item.version += 1;

      return HttpResponse.json(item);
    },
  ),

  http.post(apiPath('/gachas/upload-url'), async ({ request }) => {
    await delay(180);

    const body = (await request.json()) as CreateUploadUrlRequestDto;
    const isSupportedType = SUPPORTED_FIELD_IMAGE_TYPES.some(
      (contentType) => contentType === body.contentType,
    );

    if (!body.originalFileName.trim() || !isSupportedType) {
      return HttpResponse.json(
        { message: '지원하지 않는 이미지 파일입니다.' },
        { status: 400 },
      );
    }

    if (body.contentLength <= 0 || body.contentLength > MAX_FIELD_IMAGE_SIZE) {
      return HttpResponse.json(
        { message: '이미지는 10MB 이하로 등록해 주세요.' },
        { status: 400 },
      );
    }

    const upload = createMockFieldUpload(body);

    return HttpResponse.json({
      uploadUrl: toAbsoluteApiUrl(request.url, `/uploads/${upload.uploadId}`),
      objectKey: upload.objectKey,
      headers: { 'Content-Type': upload.contentType },
      expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
  }),

  http.put(apiPath('/uploads/:uploadId'), async ({ params, request }) => {
    await delay(300);

    const upload = fieldUploads.get(String(params.uploadId));

    if (!upload) {
      return HttpResponse.json(
        { message: '만료되었거나 존재하지 않는 업로드 요청입니다.' },
        { status: 404 },
      );
    }

    if (request.headers.get('Content-Type') !== upload.contentType) {
      return HttpResponse.json(
        { message: '서명에 포함된 이미지 형식과 요청이 다릅니다.' },
        { status: 400 },
      );
    }

    const content = await request.arrayBuffer();

    if (content.byteLength !== upload.contentLength) {
      return HttpResponse.json(
        { message: '업로드한 파일 크기가 요청 정보와 다릅니다.' },
        { status: 400 },
      );
    }

    upload.content = content;
    return new HttpResponse(null, { status: 200 });
  }),

  http.get(apiPath('/uploads/:uploadId/content'), ({ params }) => {
    const upload = fieldUploads.get(String(params.uploadId));

    if (!upload?.content) {
      return new HttpResponse(null, { status: 404 });
    }

    return new HttpResponse(upload.content, {
      headers: {
        'Content-Type': upload.contentType,
        'Cache-Control': 'private, max-age=300',
      },
    });
  }),

  http.post(apiPath('/gachas'), async ({ request }) => {
    await delay(260);

    const body = (await request.json()) as CreateFieldGachaRequestDto;
    const upload = [...fieldUploads.values()].find(
      ({ objectKey }) => objectKey === body.objectKey,
    );

    if (!upload?.content) {
      return HttpResponse.json(
        { message: '이미지 업로드를 먼저 완료해 주세요.' },
        { status: 400 },
      );
    }

    if (!body.name.trim() || body.categoryIds.length === 0) {
      return HttpResponse.json(
        { message: '이름과 카테고리를 모두 입력해 주세요.' },
        { status: 400 },
      );
    }

    const hasUnknownCategory = body.categoryIds.some(
      (categoryId) =>
        !categories.some((category) => category.categoryId === categoryId),
    );

    if (hasUnknownCategory) {
      return HttpResponse.json(
        { message: '존재하지 않는 카테고리가 포함되어 있습니다.' },
        { status: 400 },
      );
    }

    if (upload.registeredGachaId !== null) {
      const registeredItem = findItem(upload.registeredGachaId);
      return registeredItem
        ? HttpResponse.json({ item: registeredItem })
        : new HttpResponse(null, { status: 409 });
    }

    const gachaId =
      Math.max(...classificationItems.map((item) => item.gachaId), 0) + 1;
    const item = {
      gachaId,
      thumbnailUrl: toAbsoluteApiUrl(
        request.url,
        `/uploads/${upload.uploadId}/content`,
      ),
      displayName: body.name.trim(),
      originalFileName: body.originalFileName,
      source: body.source,
      location: '현장 등록',
      caption: null,
      categoryIds: [...new Set(body.categoryIds)],
      status: 'CLASSIFIED' as const,
      version: 1,
      createdAt: new Date().toISOString(),
    };

    classificationItems.push(item);
    upload.registeredGachaId = gachaId;

    return HttpResponse.json({ item }, { status: 201 });
  }),

  http.get(apiPath('/categories'), async () => {
    await delay(120);

    return HttpResponse.json(categories);
  }),

  http.post(apiPath('/categories'), async ({ request }) => {
    await delay(200);

    const body = (await request.json()) as CreateCategoryRequestDto;
    const name = body.name.trim().replace(/\s+/g, ' ');

    if (!name) {
      return HttpResponse.json(
        { message: '카테고리 이름을 입력해 주세요.' },
        { status: 400 },
      );
    }

    const duplicate = categories.some(
      (category) =>
        normalizeCategoryName(category.categoryName) ===
        normalizeCategoryName(name),
    );

    if (duplicate) {
      return HttpResponse.json(
        { message: '이미 존재하는 카테고리입니다.' },
        { status: 409 },
      );
    }

    const category: CategoryDto = {
      categoryId:
        Math.max(...categories.map(({ categoryId }) => categoryId), 0) + 1,
      categoryName: name,
    };

    categories.push(category);

    return HttpResponse.json(category, { status: 201 });
  }),

  http.delete(apiPath('/categories/:categoryId'), async ({ params }) => {
    await delay(180);

    const categoryId = Number(params.categoryId);
    const categoryIndex = categories.findIndex(
      (category) => category.categoryId === categoryId,
    );

    if (categoryIndex < 0) {
      return HttpResponse.json(
        { message: '카테고리를 찾을 수 없습니다.' },
        { status: 404 },
      );
    }

    const isInUse = classificationItems.some((item) =>
      item.categoryIds.includes(categoryId),
    );

    if (isInUse) {
      return HttpResponse.json(
        { message: '분류 데이터에 사용 중인 카테고리는 삭제할 수 없습니다.' },
        { status: 409 },
      );
    }

    categories.splice(categoryIndex, 1);

    return new HttpResponse(null, { status: 204 });
  }),
];
