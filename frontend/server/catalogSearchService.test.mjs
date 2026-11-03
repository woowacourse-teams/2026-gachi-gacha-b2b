import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CatalogSearchError,
  createCatalogSearchService,
} from './catalogSearchService.mjs';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/public-sheet/pub?output=csv&gid=0';
const CSV_HEADER =
  'gacha_id,name_ko,name_ja,aliases,work,series,characters,reviewed_at';

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

  it('매장에 연결된 가챠 ID로 카탈로그 정보를 일괄 조회하고 요청 순서를 유지한다', async () => {
    let backendCalls = 0;
    const search = createCatalogSearchService({
      backendBaseUrl: 'http://backend.example/api/v1',
      fetchImpl: async () => {
        backendCalls += 1;
        return okPage(
          [
            createGacha(1, '산리오 피규어', ['산리오']),
            createGacha(2, '건담 피규어', ['건담']),
            createGacha(3, '미분류 가챠', []),
          ],
          0,
          true,
        );
      },
    });

    const lookup = await search.getItemsByIds([2, 1, 2, 3, 99]);
    const searched = await search({ query: '산리오' });

    assert.deepEqual(
      lookup.items.map(({ gachaId }) => gachaId),
      [2, 1, 3],
    );
    assert.equal(lookup.metadataStatus, 'disabled');
    assert.deepEqual(
      searched.items.map(({ gachaId }) => gachaId),
      [1],
    );
    assert.equal(backendCalls, 1);
    await assert.rejects(
      search.getItemsByIds([0]),
      (error) => error instanceof CatalogSearchError && error.status === 400,
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

  it('CSV의 한일 이름·별칭·작품·시리즈·캐릭터로 검색하고 원본 필드는 유지한다', async () => {
    const search = createCatalogSearchService({
      backendBaseUrl: 'http://backend.example/api/v1',
      metadataCsvUrl: CSV_URL,
      fetchImpl: async (url) =>
        url.hostname === 'docs.google.com'
          ? new Response(
              [
                CSV_HEADER,
                '1,산리오 미니 피규어,サンリオ ミニ,마멜|My Melody,산리오,리틀 시리즈,마이멜로디|쿠로미,2026-11-03',
                '2,미분류 보강,未分類,미분류별칭,작품,시리즈,캐릭터,2026-11-03',
                '999,없는 가챠,なし,,,,,',
              ].join('\n'),
              { headers: { 'Content-Type': 'text/csv' } },
            )
          : okPage(
              [
                createGacha(1, '원본 상품명', ['피규어']),
                createGacha(2, '미분류 원본', []),
              ],
              0,
              true,
            ),
    });

    for (const query of [
      '산리오',
      'サンリオ',
      'ｻﾝﾘｵ',
      'My Melody',
      '마멜',
      '리틀 시리즈',
      '쿠로미',
    ]) {
      const result = await search({ query });
      assert.deepEqual(
        result.items.map(({ gachaId }) => gachaId),
        [1],
      );
      assert.equal(result.metadataStatus, 'fresh');
    }

    const filtered = await search({
      query: '산리오',
      categoryNames: ['피규어'],
    });
    const notCategory = await search({ categoryNames: ['산리오'] });
    const lookup = await search.getItemsByIds([1, 999]);

    assert.equal(filtered.totalCount, 1);
    assert.equal(notCategory.totalCount, 0);
    assert.equal(lookup.metadataStatus, 'fresh');
    assert.equal(lookup.items[0].name, '원본 상품명');
    assert.deepEqual(lookup.items[0].categories, ['피규어']);
    assert.equal(lookup.items[0].thumbnailUrl, null);
    assert.equal(lookup.items[0].metadata.nameJa, 'サンリオ ミニ');
    assert.equal(lookup.items.length, 1);
  });

  it('공개 CSV 장애가 나도 기존 가챠 검색과 ID 조회는 정상 반환한다', async () => {
    const search = createCatalogSearchService({
      backendBaseUrl: 'http://backend.example/api/v1',
      metadataCsvUrl: CSV_URL,
      fetchImpl: async (url) =>
        url.hostname === 'docs.google.com'
          ? new Response('unavailable', { status: 503 })
          : okPage([createGacha(1, '원본 상품명', ['피규어'])], 0, true),
    });

    const result = await search({ query: '원본 상품명' });
    const lookup = await search.getItemsByIds([1]);

    assert.equal(result.metadataStatus, 'unavailable');
    assert.equal(result.metadataAsOf, null);
    assert.deepEqual(
      result.items.map(({ gachaId }) => gachaId),
      [1],
    );
    assert.equal(lookup.metadataStatus, 'unavailable');
    assert.equal(lookup.items[0].metadata, undefined);
  });

  it('원본 가챠 조회가 실패하면 CSV 상태와 관계없이 검색 오류를 반환한다', async () => {
    const search = createCatalogSearchService({
      backendBaseUrl: 'http://backend.example/api/v1',
      metadataCsvUrl: CSV_URL,
      fetchImpl: async (url) =>
        url.hostname === 'docs.google.com'
          ? new Response(`${CSV_HEADER}\n1,산리오,,,,,,2026-11-03`)
          : new Response('unavailable', { status: 503 }),
    });

    await assert.rejects(
      search({ query: '산리오' }),
      (error) => error instanceof CatalogSearchError && error.status === 502,
    );
  });
});
