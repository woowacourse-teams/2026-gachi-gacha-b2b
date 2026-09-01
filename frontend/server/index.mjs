import { createServer } from 'node:http';

import {
  createAiCategorySuggestion,
  SuggestionError,
} from './aiSuggestionService.mjs';

try {
  process.loadEnvFile();
} catch (error) {
  if (error?.code !== 'ENOENT') throw error;
}

const host = process.env.AI_HOST ?? '127.0.0.1';
const port = Number(process.env.AI_PORT ?? 8787);
const maxBodyBytes = 64 * 1024;
const rateLimitWindowMs = 60_000;
const rateLimitMaxRequests = Number(process.env.AI_RATE_LIMIT_PER_MINUTE ?? 20);
const requestBuckets = new Map();

if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
  throw new Error('AI_PORT는 1부터 65535 사이의 정수여야 합니다.');
}
if (!Number.isSafeInteger(rateLimitMaxRequests) || rateLimitMaxRequests < 1) {
  throw new Error('AI_RATE_LIMIT_PER_MINUTE는 1 이상의 정수여야 합니다.');
}

const sendJson = (response, status, body) => {
  response.writeHead(status, {
    'Cache-Control': 'no-store',
    'Content-Type': 'application/json; charset=utf-8',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(body));
};

const readJson = async (request) => {
  const contentType = request.headers['content-type'] ?? '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    throw new SuggestionError(
      'Content-Type은 application/json이어야 합니다.',
      415,
    );
  }

  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBodyBytes) {
      throw new SuggestionError('요청 본문이 너무 큽니다.', 413);
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new SuggestionError('JSON 요청 본문이 올바르지 않습니다.');
  }
};

const getClientId = (request) => {
  const forwardedFor = request.headers['x-forwarded-for'];
  const firstForwardedAddress = Array.isArray(forwardedFor)
    ? forwardedFor[0]
    : forwardedFor?.split(',')[0];
  return (
    firstForwardedAddress?.trim() || request.socket.remoteAddress || 'unknown'
  );
};

const consumeRateLimit = (clientId) => {
  const now = Date.now();

  if (requestBuckets.size > 10_000) {
    for (const [key, value] of requestBuckets) {
      if (now - value.startedAt >= rateLimitWindowMs) {
        requestBuckets.delete(key);
      }
    }
  }

  const bucket = requestBuckets.get(clientId);

  if (!bucket || now - bucket.startedAt >= rateLimitWindowMs) {
    requestBuckets.set(clientId, { startedAt: now, count: 1 });
    return true;
  }

  if (bucket.count >= rateLimitMaxRequests) return false;
  bucket.count += 1;
  return true;
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host}`);

  if (request.method === 'GET' && url.pathname === '/api/b2b-ai/health') {
    sendJson(response, 200, { status: 'ok' });
    return;
  }

  if (
    request.method !== 'POST' ||
    url.pathname !== '/api/b2b-ai/suggest-categories'
  ) {
    sendJson(response, 404, { message: 'API 경로를 찾을 수 없습니다.' });
    return;
  }

  if (!consumeRateLimit(getClientId(request))) {
    sendJson(response, 429, {
      message: 'AI 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요.',
    });
    return;
  }

  try {
    const body = await readJson(request);
    const suggestion = await createAiCategorySuggestion(body);
    sendJson(response, 200, suggestion);
  } catch (error) {
    if (error instanceof SuggestionError) {
      sendJson(response, error.status, { message: error.message });
      return;
    }

    if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
      sendJson(response, 504, {
        message: 'AI 응답 시간이 초과되었습니다. 다시 시도해 주세요.',
      });
      return;
    }

    console.error('Unexpected AI BFF error', error);
    sendJson(response, 500, { message: 'AI 추천을 처리하지 못했습니다.' });
  }
});

server.listen(port, host, () => {
  console.info(`B2B AI API listening on http://${host}:${port}`);
});
