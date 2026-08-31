import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { getClassificationQueue } from '@/features/classification/api/classificationApi';
import { resetMockData } from '@/mocks/data';
import { handlers } from '@/mocks/handlers';

import {
  createFieldGacha,
  createFieldImageUploadTicket,
  uploadFieldImage,
} from './registrationApi';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetMockData();
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
});
