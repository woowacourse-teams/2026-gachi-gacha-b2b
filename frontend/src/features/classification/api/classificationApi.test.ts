import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { resetMockData } from '@/mocks/data';
import { handlers } from '@/mocks/handlers';

import {
  classifyGacha,
  createCategory,
  deleteCategory,
  getCategories,
  getClassificationItem,
  getClassificationQueue,
  getSourceFolders,
} from './classificationApi';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  server.resetHandlers();
  resetMockData();
});
afterAll(() => server.close());

describe('classification API', () => {
  it('분류 저장 후 수정된 이름과 카테고리를 분류 완료 목록에서 조회한다', async () => {
    const item = await getClassificationItem(101);

    const result = await classifyGacha(item, {
      name: '수정된 토끼 피규어',
      categoryIds: [3, 5],
    });

    const savedItem = await getClassificationItem(101);
    const classifiedQueue = await getClassificationQueue({
      status: 'CLASSIFIED',
      query: '',
    });

    expect(result.nextItemId).toBe(102);
    expect(savedItem).toMatchObject({
      name: '수정된 토끼 피규어',
      categoryIds: [3, 5],
      status: 'CLASSIFIED',
      version: item.version + 1,
    });
    expect(classifiedQueue.items.map(({ id }) => id)).toContain(101);
  });

  it('새 카테고리를 생성하고 사용 전에는 다시 삭제할 수 있다', async () => {
    const createdCategory = await createCategory('잘못 추가한 카테고리');

    await deleteCategory(createdCategory.id);

    const categories = await getCategories();
    expect(categories).not.toContainEqual(createdCategory);
  });

  it('수집 출처별 분류 대기 개수를 조회한다', async () => {
    const folders = await getSourceFolders();

    expect(folders).toEqual(
      expect.arrayContaining([
        { name: 'BANDAI', pendingCount: 2 },
        { name: 'AMUSE', pendingCount: 2 },
        { name: 'INSTAGRAM', pendingCount: 1 },
      ]),
    );
  });
});
