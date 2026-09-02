import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CatalogSearchError,
  createCatalogSearchService,
} from './catalogSearchService.mjs';

const createGacha = (gachaId, name, categories) => ({
  gachaId,
  name,
  caption: null,
  thumbnailUrl: null,
  productCode: `GACHA-${gachaId}`,
  categories,
  source: 'BANDAI',
  createdAt: '2026-09-01T00:00:00',
  updatedAt: '2026-09-01T00:00:00',
});

const okPage = (content, page, last) =>
  new Response(
    JSON.stringify({
      code: 'C000',
      message: '정상',
      data: { content, number: page, last },
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );

describe('catalog search service', () => {
  it('제목 또는 카테고리명에 검색어가 포함된 분류 완료 가챠를 반환한다', async () => {
    const requestedPages = [];
    const search = createCatalogSearchService({
      backendBaseUrl: 'http://backend.example/api/v1',
      fetchImpl: async (url) => {
        const page = Number(url.searchParams.get('page'));
        requestedPages.push(page);
        if (page === 0) {
          return okPage(
            [
              createGacha(3, '디저트 제목 가챠', ['피규어']),
              createGacha(1, '포근한 미니어처', ['작은 뽀송뽀송 디저트']),
              createGacha(2, '미분류 데이터', []),
            ],
            0,
            false,
          );
        }
        return okPage([createGacha(4, '로봇 가챠', ['메카'])], 1, true);
      },
    });

    const result = await search({ query: '디저트', limit: 1 });
    const next = await search({
      query: '디저트',
      cursor: result.nextCursor,
      limit: 1,
    });

    assert.deepEqual(
      result.items.map(({ gachaId }) => gachaId),
      [1],
    );
    assert.equal(result.totalCount, 2);
    assert.equal(result.nextCursor, 1);
    assert.deepEqual(
      next.items.map(({ gachaId }) => gachaId),
      [3],
    );
    assert.equal(next.nextCursor, null);
    assert.deepEqual(requestedPages, [0, 1]);
  });

  it('선택한 여러 카테고리 중 하나가 정확히 일치하는 결과만 반환한다', async () => {
    const search = createCatalogSearchService({
      backendBaseUrl: 'http://backend.example/api/v1',
      fetchImpl: async () =>
        okPage(
          [
            createGacha(1, '산리오 피규어', ['산리오', '피규어']),
            createGacha(2, '건담 피규어', ['건담', '피규어']),
          ],
          0,
          true,
        ),
    });

    const result = await search({ categoryNames: ['산리오', '미니어처'] });

    assert.deepEqual(
      result.items.map(({ gachaId }) => gachaId),
      [1],
    );
  });

  it('검색어의 공백과 유니코드 표기 차이를 무시한다', async () => {
    const search = createCatalogSearchService({
      backendBaseUrl: 'http://backend.example/api/v1',
      fetchImpl: async () =>
        okPage(
          [
            createGacha(1, 'SANRIO 캐릭터즈', ['배드바츠마루']),
            createGacha(2, '이누야샤 피규어', ['이누야샤']),
          ],
          0,
          true,
        ),
    });

    const spaced = await search({ query: '배드 바츠마루' });
    const fullWidth = await search({ query: 'ＳＡＮＲＩＯ' });

    assert.deepEqual(
      spaced.items.map(({ gachaId }) => gachaId),
      [1],
    );
    assert.deepEqual(
      fullWidth.items.map(({ gachaId }) => gachaId),
      [1],
    );
  });

  it('잘못된 페이지 크기는 백엔드 호출 전에 거절한다', async () => {
    const search = createCatalogSearchService({
      backendBaseUrl: 'http://backend.example/api/v1',
      fetchImpl: () => {
        throw new Error('호출되면 안 됩니다.');
      },
    });

    await assert.rejects(
      search({ limit: 101 }),
      (error) => error instanceof CatalogSearchError && error.status === 400,
    );
  });
});
