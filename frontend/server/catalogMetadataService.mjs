const MAX_CSV_BYTES = 2 * 1024 * 1024;
const MAX_CSV_ROWS = 10_000;
const MAX_CSV_COLUMNS = 32;
const MAX_CSV_FIELD_LENGTH = 2_000;
const MAX_REDIRECTS = 3;
const DEFAULT_CACHE_TTL_MS = 5 * 60_000;
const DEFAULT_RETRY_DELAY_MS = 30_000;
const REQUIRED_HEADERS = [
  'gacha_id',
  'name_ko',
  'name_ja',
  'aliases',
  'work',
  'series',
  'characters',
  'reviewed_at',
];

const isAllowedHost = (hostname) =>
  hostname === 'docs.google.com' || hostname.endsWith('.googleusercontent.com');

const validateCsvUrl = (value, initial = false) => {
  const url = new URL(value);
  if (
    url.protocol !== 'https:' ||
    (url.port && url.port !== '443') ||
    url.username ||
    url.password ||
    !isAllowedHost(url.hostname)
  ) {
    throw new Error('카탈로그 CSV는 허용된 Google HTTPS 주소여야 합니다.');
  }
  if (
    initial &&
    (url.hostname !== 'docs.google.com' ||
      !/^\/spreadsheets\/d\/(?:e\/)?[^/]+\/(?:pub|export)$/.test(
        url.pathname,
      ) ||
      !['csv'].includes(
        url.searchParams.get('output') ?? url.searchParams.get('format'),
      ))
  ) {
    throw new Error('공개 Google Sheet의 CSV 게시 URL이 필요합니다.');
  }
  url.hash = '';
  return url;
};

const parseCsvRows = (text) => {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  let afterQuote = false;

  const pushField = () => {
    row.push(field);
    if (row.length > MAX_CSV_COLUMNS) {
      throw new Error('카탈로그 CSV 열이 너무 많습니다.');
    }
    field = '';
    afterQuote = false;
  };
  const pushRow = () => {
    pushField();
    if (row.some((value) => value.trim())) rows.push(row);
    if (rows.length > MAX_CSV_ROWS + 1) {
      throw new Error('카탈로그 CSV 행이 너무 많습니다.');
    }
    row = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
        afterQuote = true;
      } else {
        field += character;
      }
    } else if (afterQuote) {
      if (character === ',') pushField();
      else if (character === '\r' || character === '\n') {
        pushRow();
        if (character === '\r' && text[index + 1] === '\n') index += 1;
      } else if (character !== ' ' && character !== '\t') {
        throw new Error('카탈로그 CSV 따옴표 형식이 올바르지 않습니다.');
      }
    } else if (character === '"') {
      if (field)
        throw new Error('카탈로그 CSV 따옴표 형식이 올바르지 않습니다.');
      quoted = true;
    } else if (character === ',') {
      pushField();
    } else if (character === '\r' || character === '\n') {
      pushRow();
      if (character === '\r' && text[index + 1] === '\n') index += 1;
    } else {
      field += character;
    }

    if (field.length > MAX_CSV_FIELD_LENGTH) {
      throw new Error('카탈로그 CSV 셀이 너무 깁니다.');
    }
  }

  if (quoted) throw new Error('카탈로그 CSV 따옴표가 닫히지 않았습니다.');
  if (row.length || field || afterQuote) pushRow();
  return rows;
};

const cleanText = (value, maxLength = 200) => {
  const cleaned = value.trim().replace(/\s+/gu, ' ');
  return cleaned.length <= maxLength ? cleaned : null;
};

const parseList = (value) => {
  const entries = value.split('|').map((entry) => cleanText(entry, 100));
  if (entries.length > 30 || entries.some((entry) => entry === null))
    return null;
  return [...new Set(entries.filter(Boolean))];
};

const isValidDate = (value) => {
  if (!value) return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value);
  return (
    !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
  );
};

export const parseCatalogMetadataCsv = (rawText) => {
  const text = rawText.replace(/^\uFEFF/, '');
  if (text.includes('\0') || /^\s*<(?:!doctype|html)/iu.test(text)) {
    throw new Error('카탈로그 CSV 응답 형식이 올바르지 않습니다.');
  }
  const [rawHeaders, ...rows] = parseCsvRows(text);
  if (!rawHeaders) throw new Error('카탈로그 CSV 헤더가 없습니다.');
  const headers = rawHeaders.map((header) => header.trim().toLowerCase());
  if (
    new Set(headers).size !== headers.length ||
    REQUIRED_HEADERS.some((header) => !headers.includes(header))
  ) {
    throw new Error('카탈로그 CSV 필수 헤더가 없습니다.');
  }
  const column = Object.fromEntries(
    headers.map((header, index) => [header, index]),
  );
  const byId = new Map();
  const duplicates = new Set();

  for (const row of rows) {
    if (row.length > headers.length) continue;
    const read = (header) => row[column[header]] ?? '';
    const rawId = read('gacha_id').trim();
    if (!/^[1-9]\d*$/.test(rawId)) continue;
    const gachaId = Number(rawId);
    if (!Number.isSafeInteger(gachaId) || duplicates.has(gachaId)) continue;
    if (byId.has(gachaId)) {
      byId.delete(gachaId);
      duplicates.add(gachaId);
      continue;
    }

    const nameKo = cleanText(read('name_ko'));
    const nameJa = cleanText(read('name_ja'));
    const work = cleanText(read('work'));
    const series = cleanText(read('series'));
    const aliases = parseList(read('aliases'));
    const characters = parseList(read('characters'));
    const reviewedAt = read('reviewed_at').trim();
    if (
      nameKo === null ||
      nameJa === null ||
      work === null ||
      series === null ||
      aliases === null ||
      characters === null ||
      !isValidDate(reviewedAt) ||
      !(
        nameKo ||
        nameJa ||
        work ||
        series ||
        aliases.length ||
        characters.length
      )
    ) {
      continue;
    }

    byId.set(gachaId, {
      nameKo,
      nameJa,
      aliases,
      work,
      series,
      characters,
      reviewedAt,
    });
  }

  return byId;
};

const readLimitedText = async (response) => {
  const lengthHeader = response.headers.get('content-length');
  if (lengthHeader && Number(lengthHeader) > MAX_CSV_BYTES) {
    throw new Error('카탈로그 CSV가 너무 큽니다.');
  }
  if (!response.body) throw new Error('카탈로그 CSV 본문이 없습니다.');

  const reader = response.body.getReader();
  const chunks = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_CSV_BYTES) {
        throw new Error('카탈로그 CSV가 너무 큽니다.');
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => {});
    throw error;
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(
    Buffer.concat(chunks, totalBytes),
  );
};

const fetchCsv = async (url, fetchImpl) => {
  let current = url;
  const signal = AbortSignal.timeout(10_000);
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects += 1) {
    const response = await fetchImpl(current, {
      headers: { Accept: 'text/csv' },
      redirect: 'manual',
      signal,
    });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location || redirects === MAX_REDIRECTS) {
        throw new Error('카탈로그 CSV 이동 주소가 올바르지 않습니다.');
      }
      current = validateCsvUrl(new URL(location, current));
      continue;
    }
    if (!response.ok) throw new Error('카탈로그 CSV를 불러오지 못했습니다.');
    const contentType =
      response.headers.get('content-type')?.toLowerCase() ?? '';
    if (contentType.includes('text/html') || contentType.includes('json')) {
      throw new Error('카탈로그 CSV 대신 다른 응답을 받았습니다.');
    }
    return readLimitedText(response);
  }
  throw new Error('카탈로그 CSV 이동 횟수가 너무 많습니다.');
};

export const createCatalogMetadataService = ({
  csvUrl = '',
  fetchImpl = fetch,
  now = Date.now,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
  retryDelayMs = DEFAULT_RETRY_DELAY_MS,
  logger = console,
} = {}) => {
  if (!csvUrl) {
    return async () => ({
      itemsById: new Map(),
      metadataStatus: 'disabled',
      metadataAsOf: null,
    });
  }

  let url;
  try {
    url = validateCsvUrl(csvUrl, true);
  } catch (error) {
    logger.warn('Catalog metadata CSV configuration rejected:', error.message);
    return async () => ({
      itemsById: new Map(),
      metadataStatus: 'unavailable',
      metadataAsOf: null,
    });
  }

  let cache = null;
  let request = null;
  let retryAt = 0;
  const snapshot = (status) => ({
    itemsById: cache?.itemsById ?? new Map(),
    metadataStatus: status,
    metadataAsOf: cache?.asOf ?? null,
  });

  const refresh = () => {
    if (request) return request;
    request = fetchCsv(url, fetchImpl)
      .then((text) => {
        const itemsById = parseCatalogMetadataCsv(text);
        const fetchedAt = now();
        cache = {
          itemsById,
          asOf: new Date(fetchedAt).toISOString(),
          expiresAt: fetchedAt + cacheTtlMs,
        };
        retryAt = 0;
        return snapshot('fresh');
      })
      .catch((error) => {
        logger.warn('Catalog metadata CSV refresh failed:', error.message);
        retryAt = now() + retryDelayMs;
        return snapshot(cache ? 'stale' : 'unavailable');
      })
      .finally(() => {
        request = null;
      });
    return request;
  };

  return async () => {
    if (cache && cache.expiresAt > now()) return snapshot('fresh');
    if (retryAt > now()) return snapshot(cache ? 'stale' : 'unavailable');
    if (cache) {
      void refresh();
      return snapshot('stale');
    }
    return refresh();
  };
};
