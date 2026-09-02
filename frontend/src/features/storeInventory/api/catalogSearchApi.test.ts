import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { resetMockData } from '@/mocks/data';
import { handlers } from '@/mocks/handlers';

import { searchAssignableGachaCatalog } from './catalogSearchApi';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetMockData();
});
afterAll(() => server.close());

describe('catalog search API', () => {
  it('검색어와 선택한 카테고리명을 BFF에 전달하고 화면 모델로 변환한다', async () => {
    let requestedUrl = '';
    server.use(
      http.get(`${__AI_API_BASE_URL__}/catalog-search`, ({ request }) => {
        requestedUrl = request.url;
        return HttpResponse.json({
          items: [
            {
              gachaId: 301,
              name: '포근한 미니어처 컬렉션',
              caption: null,
              thumbnailUrl: null,
              productCode: 'GACHA-301',
              categories: ['산리오', '피규어'],
              source: 'BANDAI',
              createdAt: '2026-09-01T00:00:00',
              updatedAt: '2026-09-01T00:00:00',
            },
          ],
          totalCount: 1,
          nextCursor: null,
        });
      }),
    );

    const result = await searchAssignableGachaCatalog({
      query: '디저트',
      categoryIds: [2, 5],
      cursor: 3,
      limit: 25,
    });

    const searchParams = new URL(requestedUrl).searchParams;
    expect(searchParams.get('query')).toBe('디저트');
    expect(searchParams.get('cursor')).toBe('3');
    expect(searchParams.get('limit')).toBe('25');
    expect(searchParams.getAll('category')).toEqual(['산리오', '피규어']);
    expect(result).toMatchObject({
      totalCount: 1,
      nextCursor: null,
      items: [
        {
          id: 301,
          name: '포근한 미니어처 컬렉션',
          categoryIds: [2, 5],
          status: 'CLASSIFIED',
        },
      ],
    });
  });
});
