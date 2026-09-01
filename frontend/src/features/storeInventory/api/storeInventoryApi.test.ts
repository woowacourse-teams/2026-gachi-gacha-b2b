import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { ApiError } from '@/apis/httpClient';
import { resetMockData } from '@/mocks/data';
import { handlers } from '@/mocks/handlers';

import {
  assignGachaToStore,
  getAllStores,
  getAssignableGachaPage,
  getAssignedGachas,
  getStoreSummary,
  removeGachaFromStore,
} from './storeInventoryApi';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetMockData();
});
afterAll(() => server.close());

describe('store inventory API', () => {
  it('전체 매장 페이지를 ID 순으로 모으고 선택한 매장 상세를 조회한다', async () => {
    const stores = await getAllStores();
    const store = await getStoreSummary(2);

    expect(stores.map(({ id }) => id)).toEqual([1, 2, 3]);
    expect(store).toMatchObject({
      id: 2,
      name: '국제전자센터 가챠존',
      machineCount: 72,
    });
  });

  it('매장에 가챠를 등록하고 제거하며 중복 요청은 충돌로 처리한다', async () => {
    expect(await getAssignedGachas(3)).toEqual([]);

    await assignGachaToStore(3, 105);
    expect((await getAssignedGachas(3)).map(({ id }) => id)).toEqual([105]);

    await expect(assignGachaToStore(3, 105)).rejects.toMatchObject({
      name: ApiError.name,
      status: 409,
      message: '이미 매장에 등록된 가챠입니다.',
    });

    await removeGachaFromStore(3, 105);
    expect(await getAssignedGachas(3)).toEqual([]);
  });

  it('분류 완료 가챠만 이름과 다중 카테고리 OR 조건으로 조회한다', async () => {
    const named = await getAssignableGachaPage({
      query: '산리오',
      categoryIds: [],
    });
    const categorized = await getAssignableGachaPage({
      query: '',
      categoryIds: [5, 7],
    });

    expect(named.items.map(({ id }) => id)).toEqual([105]);
    expect(categorized.items.map(({ id }) => id)).toEqual([105, 107, 108]);
    expect(
      categorized.items.every(({ status }) => status === 'CLASSIFIED'),
    ).toBe(true);
  });
});
