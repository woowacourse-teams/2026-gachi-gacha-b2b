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
}

export const request = async <Response>(
  path: string,
  options: RequestOptions = {},
): Promise<Response> => {
  const { body, ...requestOptions } = options;
  const headers = new Headers(options.headers);
  const requestInit: RequestInit = {
    ...requestOptions,
    headers,
    credentials: 'include',
  };

  if (body !== undefined) {
    headers.set('Content-Type', 'application/json');
    requestInit.body = JSON.stringify(body);
  }

  const response = await fetch(`${__API_BASE_URL__}${path}`, requestInit);

  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const message =
      typeof body === 'object' && body !== null && 'message' in body
        ? String(body.message)
        : '요청을 처리하지 못했습니다.';

    throw new ApiError(message, response.status);
  }

  if (response.status === 204) {
    return undefined as Response;
  }

  return response.json() as Promise<Response>;
};
