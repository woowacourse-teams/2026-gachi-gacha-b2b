import { delay, http, HttpResponse } from 'msw';

import { normalizeCategoryName } from '@/features/classification/model/category';
import type { ClassificationStatus } from '@/features/classification/model/classification';

import { categories, classificationItems } from './data';
import type {
  CategoryDto,
  ClassifyGachaRequestDto,
  CreateCategoryRequestDto,
  RestoreGachaRequestDto,
  SkipGachaRequestDto,
} from '../features/classification/api/classification.dto';

const apiPath = (path: string) => `${__API_BASE_URL__}${path}`;

const isStatus = (value: string | null): value is ClassificationStatus =>
  value === 'UNCLASSIFIED' || value === 'CLASSIFIED' || value === 'SKIPPED';

const findItem = (itemId: number) =>
  classificationItems.find((item) => item.gachaId === itemId);

const getNextItemId = (currentItemId: number) => {
  const currentItem = findItem(currentItemId);

  return (
    classificationItems.find(
      (item) =>
        item.status === 'UNCLASSIFIED' &&
        item.gachaId !== currentItemId &&
        item.source === currentItem?.source,
    )?.gachaId ?? null
  );
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
    const source = url.searchParams.get('source');
    const statusItems = classificationItems.filter(
      (item) => item.status === status && (!source || item.source === source),
    );
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

  http.get(apiPath('/sources'), async () => {
    await delay(150);

    const sourceCounts = classificationItems.reduce<Map<string, number>>(
      (counts, item) => {
        const pendingCount = item.status === 'UNCLASSIFIED' ? 1 : 0;
        counts.set(item.source, (counts.get(item.source) ?? 0) + pendingCount);
        return counts;
      },
      new Map(),
    );

    return HttpResponse.json(
      [...sourceCounts.entries()].map(([source, pendingCount]) => ({
        source,
        pendingCount,
      })),
    );
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

      return HttpResponse.json({ nextGachaId: getNextItemId(item.gachaId) });
    },
  ),

  http.post(
    apiPath('/classifications/:itemId/skip'),
    async ({ params, request }) => {
      await delay(250);

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

      return HttpResponse.json({ nextGachaId: getNextItemId(item.gachaId) });
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
