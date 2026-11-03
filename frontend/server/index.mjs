import { createServer } from 'node:http';

import {
  CatalogSearchError,
  createCatalogSearchService,
} from './catalogSearchService.mjs';

try {
  process.loadEnvFile();
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const host = process.env.BFF_HOST ?? process.env.AI_HOST ?? '127.0.0.1';
const port = Number(process.env.BFF_PORT ?? process.env.AI_PORT ?? 8787);
const searchCatalog = createCatalogSearchService({
  backendBaseUrl:
    process.env.B2B_BACKEND_BASE_URL ?? 'http://127.0.0.1:8080/api/v1',
});

if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
  throw new Error('BFF_PORT는 1부터 65535 사이의 정수여야 합니다.');
}

const sendJson = (response, status, body) => {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (request.method === 'GET' && url.pathname === '/api/b2b-ai/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  if (
    request.method === 'GET' &&
    url.pathname === '/api/b2b-ai/catalog-search'
  ) {
    try {
      const result = await searchCatalog({
        query: url.searchParams.get('query') ?? '',
        categoryNames: url.searchParams.getAll('category'),
        cursor: url.searchParams.get('cursor'),
        limit: url.searchParams.get('limit'),
      });
      sendJson(response, 200, result);
    } catch (error) {
      if (error instanceof CatalogSearchError) {
        sendJson(response, error.status, { message: error.message });
      } else {
        console.error('Unexpected catalog search BFF error', error);
        sendJson(response, 500, {
          message: '가챠 통합 검색을 처리하지 못했습니다.',
        });
      }
    }
    return;
  }

  if (
    request.method === 'GET' &&
    url.pathname === '/api/b2b-ai/catalog-items'
  ) {
    try {
      const items = await searchCatalog.getItemsByIds(
        url.searchParams.getAll('gachaId').map(Number),
      );
      sendJson(response, 200, { items });
    } catch (error) {
      if (error instanceof CatalogSearchError) {
        sendJson(response, error.status, { message: error.message });
      } else {
        console.error('Unexpected catalog item lookup error', error);
        sendJson(response, 500, {
          message: '등록 가챠 정보를 불러오지 못했습니다.',
        });
      }
    }
    return;
  }

  sendJson(response, 404, { message: 'API 경로를 찾을 수 없습니다.' });
});

server.listen(port, host, () => {
  console.info(`B2B frontend BFF listening on http://${host}:${port}`);
});
