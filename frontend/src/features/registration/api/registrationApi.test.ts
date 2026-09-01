import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { getClassificationQueue } from '@/features/classification/api/classificationApi';
import { resetMockData } from '@/mocks/data';
import { handlers } from '@/mocks/handlers';

import {
  createBackendFieldGacha,
  createFieldGacha,
  createFieldImageUploadTicket,
  uploadFieldImage,
} from './registrationApi';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetMockData();
  vi.unstubAllGlobals();
});
afterAll(() => server.close());

describe('field gacha registration API', () => {
  it('업로드한 사진과 분류 정보를 신규 가챠로 저장한다', async () => {
    const file = new File(['field image'], 'field-gacha.png', {
      type: 'image/png',
    });
    const ticket = await createFieldImageUploadTicket(file);

    await uploadFieldImage(file, ticket);
    const result = await createFieldGacha({
      file,
      objectKey: ticket.objectKey,
      draft: { name: '현장 등록 가챠', categoryIds: [3, 5] },
    });
    const classifiedQueue = await getClassificationQueue({
      status: 'CLASSIFIED',
      query: '현장 등록 가챠',
    });

    expect(result.item).toMatchObject({
      name: '현장 등록 가챠',
      source: 'FIELD',
      categoryIds: [3, 5],
      status: 'CLASSIFIED',
    });
    expect(classifiedQueue.items.map(({ id }) => id)).toContain(result.item.id);
  });

  it('실제 백엔드에 가챠를 생성한 뒤 multipart 썸네일을 저장한다', async () => {
    const file = new File(['field image'], 'field-gacha.png', {
      type: 'image/png',
    });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        Response.json({
          code: 'C001',
          message: '생성했습니다.',
          data: {
            gachaId: 301,
            name: '현장 등록 가챠',
            caption: null,
            thumbnailUrl: null,
            productCode: null,
            categories: ['피규어'],
            source: 'MANUAL',
            createdAt: '2026-09-01T09:00:00',
            updatedAt: '2026-09-01T09:00:00',
          },
        }),
      )
      .mockResolvedValueOnce(
        Response.json({
          code: 'C002',
          message: '수정했습니다.',
          data: {
            gachaId: 301,
            name: '현장 등록 가챠',
            caption: null,
            thumbnailUrl: 'https://images.example.com/301.png',
            productCode: null,
            categories: ['피규어'],
            source: 'MANUAL',
            createdAt: '2026-09-01T09:00:00',
            updatedAt: '2026-09-01T09:01:00',
          },
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await createBackendFieldGacha({
      file,
      draft: { name: '현장 등록 가챠', categoryIds: [7] },
      categories: [{ id: 7, name: '피규어' }],
    });

    const secondRequest = fetchMock.mock.calls[1];
    const requestBody = secondRequest?.[1]?.body;
    expect(requestBody).toBeInstanceOf(FormData);
    expect((requestBody as FormData).get('image')).toBe(file);
    expect(result.item).toMatchObject({
      id: 301,
      imageUrl: 'https://images.example.com/301.png',
      source: 'MANUAL',
      status: 'CLASSIFIED',
    });
  });
});
