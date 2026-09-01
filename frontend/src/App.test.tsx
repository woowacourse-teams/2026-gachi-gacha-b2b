import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import App from '@/App';
import { resetMockData } from '@/mocks/data';
import { handlers } from '@/mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockData();
  sessionStorage.clear();
  window.history.replaceState({}, '', '/');
});
afterAll(() => server.close());

describe('App navigation', () => {
  it('왼쪽 메뉴로 목록 상태를 이동하며 JSON 데이터를 다시 조회한다', async () => {
    window.history.replaceState({}, '', '/');
    render(<App />);

    expect(
      await screen.findByRole('heading', { name: '미분류 데이터' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /분류 완료/ }));
    expect(
      await screen.findByRole('heading', { name: '분류 완료 데이터' }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /건너뛴 데이터/ }));
    expect(
      await screen.findByRole('heading', { name: '건너뛴 데이터' }),
    ).toBeInTheDocument();
  });
});
