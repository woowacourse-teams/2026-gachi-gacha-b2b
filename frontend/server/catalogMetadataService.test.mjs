import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createCatalogMetadataService,
  parseCatalogMetadataCsv,
} from './catalogMetadataService.mjs';

const CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/public-sheet/pub?output=csv&gid=0';
const HEADER =
  'gacha_id,name_ko,name_ja,aliases,work,series,characters,reviewed_at';
const csvResponse = (body, init = {}) =>
  new Response(body, {
    status: init.status ?? 200,
    headers: { 'Content-Type': 'text/csv', ...init.headers },
  });
const silentLogger = { warn: () => {} };

describe('catalog metadata CSV', () => {
  it('BOM, 쉼표와 줄바꿈이 있는 인용 셀을 읽고 중복 ID와 잘못된 행은 제외한다', () => {
    const csv = [
      `\uFEFF${HEADER}`,
      '101,"산리오, 미니 피규어",サンリオ,마멜|My Melody,산리오,미니 시리즈,"마이\n멜로디|쿠로미",2026-11-03',
      '102,건담,ガンダム,,,,,2026-99-99',
      '103,첫 번째,,,,,,2026-11-03',
      '103,중복,,,,,,2026-11-03',
      'not-an-id,무효,,,,,,2026-11-03',
      '104,단독 이름,,,,,,',
    ].join('\r\n');

    const result = parseCatalogMetadataCsv(csv);

    assert.deepEqual([...result.keys()], [101, 104]);
    assert.deepEqual(result.get(101), {
      nameKo: '산리오, 미니 피규어',
      nameJa: 'サンリオ',
      aliases: ['마멜', 'My Melody'],
      work: '산리오',
      series: '미니 시리즈',
      characters: ['마이 멜로디', '쿠로미'],
      reviewedAt: '2026-11-03',
    });
  });

  it('HTML 로그인 화면과 헤더가 없는 CSV를 거절한다', () => {
    assert.throws(() => parseCatalogMetadataCsv('<html>sign in</html>'));
    assert.throws(() => parseCatalogMetadataCsv('id,name\n1,가챠'));
    assert.throws(() =>
      parseCatalogMetadataCsv(`${HEADER}\n101,${'가'.repeat(2_001)},,,,,,`),
    );
  });

  it('고정된 Google HTTPS CSV URL만 읽고 외부 리디렉션을 거절한다', async () => {
    let calls = 0;
    const invalid = createCatalogMetadataService({
      csvUrl: 'http://127.0.0.1/private',
      fetchImpl: () => {
        calls += 1;
        throw new Error('호출되면 안 됩니다.');
      },
      logger: silentLogger,
    });
    assert.equal((await invalid()).metadataStatus, 'unavailable');
    assert.equal(calls, 0);

    const redirect = createCatalogMetadataService({
      csvUrl: CSV_URL,
      fetchImpl: async () => {
        calls += 1;
        return new Response(null, {
          status: 302,
          headers: { Location: 'http://127.0.0.1/private' },
        });
      },
      logger: silentLogger,
    });
    assert.equal((await redirect()).metadataStatus, 'unavailable');
    assert.equal(calls, 1);
  });

  it('허용된 Google redirect의 CSV만 읽고 HTML 또는 크기 초과 응답은 기존 상태로 복귀한다', async () => {
    const redirectUrl = 'https://doc-123-sheets.googleusercontent.com/data.csv';
    const seen = [];
    const redirected = createCatalogMetadataService({
      csvUrl: CSV_URL,
      fetchImpl: async (url) => {
        seen.push(url.toString());
        return seen.length === 1
          ? new Response(null, {
              status: 302,
              headers: { Location: redirectUrl },
            })
          : csvResponse(`${HEADER}\n101,산리오,,,,,,2026-11-03`);
      },
      logger: silentLogger,
    });
    assert.equal((await redirected()).metadataStatus, 'fresh');
    assert.deepEqual(seen, [CSV_URL, redirectUrl]);

    const html = createCatalogMetadataService({
      csvUrl: CSV_URL,
      fetchImpl: async () =>
        new Response('<html>sign in</html>', {
          headers: { 'Content-Type': 'text/html' },
        }),
      logger: silentLogger,
    });
    assert.equal((await html()).metadataStatus, 'unavailable');

    const tooLarge = createCatalogMetadataService({
      csvUrl: CSV_URL,
      fetchImpl: async () =>
        csvResponse(`${HEADER}\n`, {
          headers: { 'Content-Length': String(2 * 1024 * 1024 + 1) },
        }),
      logger: silentLogger,
    });
    assert.equal((await tooLarge()).metadataStatus, 'unavailable');

    const oversizedStream = createCatalogMetadataService({
      csvUrl: CSV_URL,
      fetchImpl: async () => csvResponse('x'.repeat(2 * 1024 * 1024 + 1)),
      logger: silentLogger,
    });
    assert.equal((await oversizedStream()).metadataStatus, 'unavailable');
  });

  it('동시 요청을 공유하고 갱신 실패 시 마지막 정상본을 제공한 뒤 재시도한다', async () => {
    let currentTime = 0;
    let calls = 0;
    const getMetadata = createCatalogMetadataService({
      csvUrl: CSV_URL,
      now: () => currentTime,
      cacheTtlMs: 100,
      retryDelayMs: 50,
      fetchImpl: async () => {
        calls += 1;
        if (calls === 2) throw new Error('temporary outage');
        return csvResponse(`${HEADER}\n101,산리오,,,,,,2026-11-03`);
      },
      logger: silentLogger,
    });

    const [first, sameFlight] = await Promise.all([
      getMetadata(),
      getMetadata(),
    ]);
    assert.equal(first.metadataStatus, 'fresh');
    assert.equal(sameFlight.metadataStatus, 'fresh');
    assert.equal(calls, 1);

    currentTime = 101;
    const stale = await getMetadata();
    assert.equal(stale.metadataStatus, 'stale');
    assert.equal(stale.itemsById.get(101).nameKo, '산리오');
    assert.equal(stale.metadataAsOf, first.metadataAsOf);
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal((await getMetadata()).metadataStatus, 'stale');
    assert.equal(calls, 2);

    currentTime = 152;
    assert.equal((await getMetadata()).metadataStatus, 'stale');
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal((await getMetadata()).metadataStatus, 'fresh');
    assert.equal(calls, 3);
  });

  it('CSV를 설정하지 않으면 외부 요청 없이 기존 검색만 사용한다', async () => {
    const getMetadata = createCatalogMetadataService({
      fetchImpl: () => {
        throw new Error('호출되면 안 됩니다.');
      },
    });
    assert.deepEqual(await getMetadata(), {
      itemsById: new Map(),
      metadataStatus: 'disabled',
      metadataAsOf: null,
    });
  });
});
