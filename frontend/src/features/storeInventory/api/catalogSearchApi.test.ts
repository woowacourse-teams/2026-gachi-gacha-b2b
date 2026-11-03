import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { resetMockData } from '@/mocks/data';
import { handlers } from '@/mocks/handlers';

import {
  getCatalogItemsByIds,
  searchAssignableGachaCatalog,
} from './catalogSearchApi';

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
      http.get(`${__BFF_API_BASE_URL__}/catalog-search`, ({ request }) => {
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
              metadata: {
                nameKo: '포근한 미니어처 컬렉션',
                nameJa: 'ふわふわミニチュア',
                aliases: ['포근한 가챠'],
                work: '산리오 캐릭터즈',
                series: '미니 시리즈',
                characters: ['마이멜로디'],
                reviewedAt: '2026-11-03',
              },
            },
          ],
          totalCount: 1,
          nextCursor: null,
          metadataStatus: 'fresh',
          metadataAsOf: '2026-11-03T00:00:00.000Z',
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
      metadataStatus: 'fresh',
      metadataAsOf: '2026-11-03T00:00:00.000Z',
      items: [
        {
          id: 301,
          name: '포근한 미니어처 컬렉션',
          categoryIds: [2, 5],
          status: 'CLASSIFIED',
          metadata: {
            nameJa: 'ふわふわミニチュア',
            characters: ['마이멜로디'],
          },
        },
      ],
    });
  });

  it('등록 가챠 ID 조회에서 보강 메타데이터와 상태를 유지한다', async () => {
    server.use(
      http.get(`${__BFF_API_BASE_URL__}/catalog-items`, ({ request }) => {
        expect(new URL(request.url).searchParams.getAll('gachaId')).toEqual([
          '105',
        ]);
        return HttpResponse.json({
          items: [
            {
              gachaId: 105,
              name: '산리오 미니 피규어',
              caption: null,
              thumbnailUrl: '/mock/gacha-pink.svg',
              productCode: 'GACHA-105',
              categories: ['산리오', '피규어'],
              source: 'BANDAI',
              createdAt: '2026-09-01T00:00:00',
              updatedAt: '2026-09-01T00:00:00',
              metadata: {
                nameKo: '산리오 미니 피규어',
                nameJa: 'サンリオ ミニフィギュア',
                aliases: ['마멜'],
                work: '산리오',
                series: '미니 시리즈',
                characters: ['마이멜로디'],
                reviewedAt: '2026-11-03',
              },
            },
          ],
          metadataStatus: 'stale',
          metadataAsOf: '2026-11-03T00:00:00.000Z',
        });
      }),
    );

    const result = await getCatalogItemsByIds([105]);

    expect(result.metadataStatus).toBe('stale');
    expect(result.metadataAsOf).toBe('2026-11-03T00:00:00.000Z');
    expect(result.items).toMatchObject([
      {
        id: 105,
        name: '산리오 미니 피규어',
        metadata: {
          nameJa: 'サンリオ ミニフィギュア',
          aliases: ['마멜'],
        },
      },
    ]);
  });
});
