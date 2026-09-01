export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  formData?: FormData;
}

interface ApiResponse<Data> {
  code: string;
  message: string;
  data: Data;
}

const getJsonBody = async (response: Response): Promise<unknown> => {
  const contentType = response.headers.get('Content-Type')?.toLowerCase() ?? '';
  const rawBody = await response.text();

  if (!rawBody) return undefined;

  if (
    !contentType.includes('application/json') &&
    !contentType.includes('+json')
  ) {
    throw new ApiError(
      'API 대신 HTML 문서가 반환되었습니다. 개발 서버의 MSW 상태 또는 API 경로를 확인해 주세요.',
      502,
    );
  }

  try {
    return JSON.parse(rawBody) as unknown;
  } catch {
    throw new ApiError('API의 JSON 응답 형식이 올바르지 않습니다.', 502);
  }
};

export const requestFrom = async <Response>(
  baseUrl: string,
  path: string,
  options: RequestOptions = {},
): Promise<Response> => {
  const { body, formData, ...requestOptions } = options;
  const headers = new Headers(options.headers);
  const requestInit: RequestInit = {
    ...requestOptions,
    headers,
    credentials: 'include',
  };

  if (formData) {
    requestInit.body = formData;
  } else if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(`${baseUrl}${path}`, requestInit);

  if (!response.ok) {
    const body = await getJsonBody(response).catch(() => undefined);
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String(body.message)
        : '요청을 처리하지 못했습니다.';

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as Response;
  }

  return (await getJsonBody(response)) as Response;
};

export const request = <Response>(path: string, options: RequestOptions = {}) =>
  requestFrom<Response>(__API_BASE_URL__, path, options);

export const requestData = async <Data>(
  path: string,
  options: RequestOptions = {},
): Promise<Data> => {
  const response = await request<ApiResponse<Data>>(path, options);

  if (
    typeof response !== 'object' ||
    response === null ||
    typeof response.code !== 'string' ||
    !('data' in response)
  ) {
    throw new ApiError('백엔드 공통 응답 형식이 올바르지 않습니다.', 502);
  }

  return response.data;
};
