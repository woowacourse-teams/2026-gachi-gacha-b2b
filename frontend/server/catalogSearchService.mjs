const DEFAULT_CACHE_TTL_MS = 30_000;
const DEFAULT_BACKEND_PAGE_SIZE = 500;
const MAX_BACKEND_PAGES = 100;
const MAX_QUERY_LENGTH = 100;
const MAX_CATEGORY_FILTERS = 50;
const MAX_RESULT_SIZE = 100;

export class CatalogSearchError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.name = 'CatalogSearchError';
    this.status = status;
  }
}

const isRecord = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const normalizeText = (value) =>
  value.normalize('NFKC').toLocaleLowerCase('ko-KR').replace(/\s+/gu, '');

const parseInteger = (value, fallback, { min, max }) => {
  if (value === undefined || value === null || value === '') return fallback;

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new CatalogSearchError(
      `${min} 이상 ${max} 이하의 정수가 필요합니다.`,
    );
  }
  return parsed;
};

const parseBackendBaseUrl = (rawUrl) => {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error('B2B_BACKEND_BASE_URL이 올바른 URL이 아닙니다.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('B2B_BACKEND_BASE_URL은 HTTP 또는 HTTPS URL이어야 합니다.');
  }
  if (url.username || url.password) {
    throw new Error('B2B_BACKEND_BASE_URL에는 인증 정보를 포함할 수 없습니다.');
  }

  url.search = '';
  url.hash = '';
  return url.toString().replace(/\/$/, '');
};

const toCatalogItem = (value) => {
  if (
    !isRecord(value) ||
    !Number.isSafeInteger(value.gachaId) ||
    value.gachaId <= 0 ||
    !Array.isArray(value.categories) ||
    value.categories.some((category) => typeof category !== 'string')
  ) {
    throw new CatalogSearchError(
      '백엔드 가챠 목록 응답 형식이 올바르지 않습니다.',
      502,
    );
  }

  return {
    ...value,
    categories: [
      ...new Set(value.categories.map((name) => name.trim())),
    ].filter(Boolean),
  };
};

const parseBackendPage = (body) => {
  if (
    !isRecord(body) ||
    body.code !== 'C000' ||
    !isRecord(body.data) ||
    !Array.isArray(body.data.content) ||
    typeof body.data.last !== 'boolean'
  ) {
    throw new CatalogSearchError(
      '백엔드 가챠 목록 응답 형식이 올바르지 않습니다.',
      502,
    );
  }

  return {
    items: body.data.content.map(toCatalogItem),
    last: body.data.last,
  };
};

const readBackendPage = async (url, fetchImpl) => {
  let response;
  try {
    response = await fetchImpl(url, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new CatalogSearchError(
      '백엔드 가챠 목록에 연결하지 못했습니다.',
      502,
    );
  }

  if (!response.ok) {
    throw new CatalogSearchError(
      '백엔드 가챠 목록을 불러오지 못했습니다.',
      502,
    );
  }

  try {
    return parseBackendPage(await response.json());
  } catch (error) {
    if (error instanceof CatalogSearchError) throw error;
    throw new CatalogSearchError(
      '백엔드 가챠 목록 응답 형식이 올바르지 않습니다.',
      502,
    );
  }
};

const matchesQuery = (item, normalizedQuery) =>
  !normalizedQuery ||
  (typeof item.name === 'string' &&
    normalizeText(item.name).includes(normalizedQuery)) ||
  item.categories.some((category) =>
    normalizeText(category).includes(normalizedQuery),
  );

const matchesCategories = (item, normalizedCategoryNames) =>
  normalizedCategoryNames.size === 0 ||
  item.categories.some((category) =>
    normalizedCategoryNames.has(normalizeText(category)),
  );

export const createCatalogSearchService = ({
  backendBaseUrl,
  fetchImpl = fetch,
  cacheTtlMs = DEFAULT_CACHE_TTL_MS,
  backendPageSize = DEFAULT_BACKEND_PAGE_SIZE,
  now = Date.now,
}) => {
  const baseUrl = parseBackendBaseUrl(backendBaseUrl);
  let catalogCache = null;
  let catalogRequest = null;

  const loadCatalog = async () => {
    const items = [];

    for (let page = 0; page < MAX_BACKEND_PAGES; page += 1) {
      const url = new URL(`${baseUrl}/gachas`);
      url.searchParams.set('page', String(page));
      url.searchParams.set('size', String(backendPageSize));
      url.searchParams.set('sort', 'id,asc');

      const backendPage = await readBackendPage(url, fetchImpl);
      items.push(...backendPage.items);
      if (backendPage.last) {
        return items.sort((left, right) => left.gachaId - right.gachaId);
      }
    }

    throw new CatalogSearchError(
      '백엔드 가챠 목록 페이지가 너무 많아 조회를 중단했습니다.',
      502,
    );
  };

  const getCatalog = async () => {
    if (catalogCache && catalogCache.expiresAt > now()) {
      return catalogCache.items;
    }
    if (catalogRequest) return catalogRequest;

    catalogRequest = loadCatalog()
      .then((items) => {
        catalogCache = { items, expiresAt: now() + cacheTtlMs };
        return items;
      })
      .finally(() => {
        catalogRequest = null;
      });

    return catalogRequest;
  };

  return async ({ query = '', categoryNames = [], cursor, limit } = {}) => {
    if (typeof query !== 'string' || query.length > MAX_QUERY_LENGTH) {
      throw new CatalogSearchError(
        `검색어는 ${MAX_QUERY_LENGTH}자 이하의 문자열이어야 합니다.`,
      );
    }
    if (
      !Array.isArray(categoryNames) ||
      categoryNames.length > MAX_CATEGORY_FILTERS ||
      categoryNames.some(
        (categoryName) =>
          typeof categoryName !== 'string' || categoryName.length > 100,
      )
    ) {
      throw new CatalogSearchError('카테고리 필터가 올바르지 않습니다.');
    }

    const page = parseInteger(cursor, 0, { min: 0, max: 1_000_000 });
    const pageSize = parseInteger(limit, 50, {
      min: 1,
      max: MAX_RESULT_SIZE,
    });
    const normalizedQuery = normalizeText(query);
    const normalizedCategoryNames = new Set(
      categoryNames.map(normalizeText).filter(Boolean),
    );
    const catalog = await getCatalog();
    const filteredItems = catalog.filter(
      (item) =>
        item.categories.length > 0 &&
        matchesQuery(item, normalizedQuery) &&
        matchesCategories(item, normalizedCategoryNames),
    );
    const start = page * pageSize;
    const items = filteredItems.slice(start, start + pageSize);

    return {
      items,
      totalCount: filteredItems.length,
      nextCursor: start + items.length < filteredItems.length ? page + 1 : null,
    };
  };
};
