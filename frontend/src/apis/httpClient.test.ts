import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiError, requestFrom } from './httpClient';

afterEach(() => vi.unstubAllGlobals());

describe('HTTP client', () => {
  it('SPA fallback HTML을 JSON으로 파싱하지 않고 API 경로 오류로 변환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response('<!doctype html><html></html>', {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }),
      ),
    );

    await expect(requestFrom('/api/b2b', '/categories')).rejects.toMatchObject({
      name: 'ApiError',
      status: 502,
      message:
        'API 대신 HTML 문서가 반환되었습니다. 개발 서버의 MSW 상태 또는 API 경로를 확인해 주세요.',
    } satisfies Partial<ApiError>);
  });

  it('JSON 응답을 반환한다', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ categoryId: 1, categoryName: '피규어' }),
        ),
    );

    await expect(requestFrom('/api/b2b', '/categories/1')).resolves.toEqual({
      categoryId: 1,
      categoryName: '피규어',
    });
  });
});
