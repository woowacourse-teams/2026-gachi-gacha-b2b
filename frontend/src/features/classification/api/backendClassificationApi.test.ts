import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  classifyBackendGacha,
  getBackendCategories,
  getBackendClassificationQueue,
} from './backendClassificationApi';
import type { BackendGachaDto, BackendPageDto } from './classification.dto';
import type { ClassificationItem } from '../model/classification';

const createGacha = (
  gachaId: number,
  categories: string[],
): BackendGachaDto => ({
  gachaId,
  name: `가챠 ${gachaId}`,
  caption: null,
  thumbnailUrl: `https://images.example.com/${gachaId}.jpg`,
  productCode: `CODE-${gachaId}`,
  categories,
  source: 'BANDAI',
  createdAt: '2026-09-01T09:00:00',
  updatedAt: '2026-09-01T09:00:00',
});

const createPage = (
  content: BackendGachaDto[],
  number: number,
  last: boolean,
): BackendPageDto<BackendGachaDto> => ({
  content,
  totalElements: 2,
  totalPages: 2,
  size: 1,
  number,
  first: number === 0,
  last,
  empty: content.length === 0,
});

const ok = <Data>(data: Data) =>
  HttpResponse.json({ code: 'C000', message: '요청에 성공했습니다.', data });

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('실제 B2B 백엔드 API 어댑터', () => {
  it('공통 응답의 카테고리를 화면 모델로 변환한다', async () => {
    server.use(
      http.get(`${__API_BASE_URL__}/categories`, () =>
        ok([{ categoryId: 7, name: '피규어' }]),
      ),
    );

    await expect(getBackendCategories()).resolves.toEqual([
      { id: 7, name: '피규어' },
    ]);
  });

  it('Spring Page를 ID 오름차순으로 조회하고 조건에 맞는 페이지까지 탐색한다', async () => {
    const requestedPages: string[] = [];
    server.use(
      http.get(`${__API_BASE_URL__}/categories`, () =>
        ok([{ categoryId: 7, name: '피규어' }]),
      ),
      http.get(`${__API_BASE_URL__}/gachas`, ({ request }) => {
        const url = new URL(request.url);
        const page = url.searchParams.get('page') ?? '0';
        requestedPages.push(page);
        expect(url.searchParams.get('sort')).toBe('id,asc');

        return page === '0'
          ? ok(createPage([createGacha(10, ['피규어'])], 0, false))
          : ok(createPage([createGacha(11, [])], 1, true));
      }),
    );

    const queue = await getBackendClassificationQueue({
      status: 'UNCLASSIFIED',
      query: '',
      limit: 1,
    });

    expect(requestedPages).toEqual(['0', '1']);
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]).toMatchObject({
      id: 11,
      status: 'UNCLASSIFIED',
      categoryIds: [],
    });
    expect(queue.nextCursor).toBeNull();
  });

  it('수정한 이름과 카테고리 ID를 PATCH 요청으로 저장한다', async () => {
    let updateBody: unknown;
    server.use(
      http.patch(`${__API_BASE_URL__}/gachas/11`, async ({ request }) => {
        updateBody = await request.json();
        return ok({ gachaId: 11, updatedAt: '2026-09-01T10:00:00' });
      }),
      http.get(`${__API_BASE_URL__}/categories`, () =>
        ok([{ categoryId: 7, name: '피규어' }]),
      ),
      http.get(`${__API_BASE_URL__}/gachas`, () => ok(createPage([], 0, true))),
    );
    const item: ClassificationItem = {
      id: 11,
      imageUrl: '',
      name: '기존 이름',
      originalFileName: 'CODE-11',
      source: 'BANDAI',
      locationLabel: '위치 정보 없음',
      description: '',
      categoryIds: [],
      status: 'UNCLASSIFIED',
      version: 0,
      createdAt: '2026-09-01T09:00:00',
    };

    const result = await classifyBackendGacha(item, {
      name: '수정 이름',
      categoryIds: [7],
    });

    expect(updateBody).toEqual({ name: '수정 이름', categories: [7] });
    expect(result.nextItemId).toBeNull();
  });
});
