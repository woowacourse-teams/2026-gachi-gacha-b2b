import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
  waitFor,
} from '@testing-library/react';
import { http, HttpResponse } from 'msw';
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

import App from '@/App';
import { getCategories } from '@/features/classification/api/classificationApi';
import { classificationItems, resetMockData } from '@/mocks/data';
import { handlers } from '@/mocks/handlers';

const server = setupServer(...handlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
  resetMockData();
  sessionStorage.clear();
  vi.restoreAllMocks();
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

  it('기본 상태에서는 분류 화면에 들어가도 AI를 호출하지 않는다', async () => {
    let aiRequestCount = 0;
    server.use(
      http.post('http://localhost/api/b2b-ai/suggest-categories', () => {
        aiRequestCount += 1;
        return HttpResponse.json({ message: '호출되면 안 됩니다.' });
      }),
    );
    window.history.replaceState({}, '', '/classify/101');

    render(<App />);

    expect(await screen.findByDisplayValue('귀여운 토끼 피규어')).toBeVisible();
    expect(
      screen.getByText('AI 보조가 꺼져 있습니다. 직접 입력해 주세요.'),
    ).toBeVisible();
    expect(aiRequestCount).toBe(0);
  });

  it('개인 키로 AI를 켜면 번역 이름과 작품·캐릭터 카테고리를 초안에 반영한다', async () => {
    window.history.replaceState({}, '', '/classify/101');
    render(<App />);
    await screen.findByDisplayValue('귀여운 토끼 피규어');

    fireEvent.click(screen.getByRole('button', { name: 'AI 설정' }));
    fireEvent.change(screen.getByLabelText('개인 API 키'), {
      target: { value: 'test-gemini-key' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'AI 보조 켜기' }));

    expect(await screen.findByText(/AI 추천을 입력했습니다/)).toBeVisible();
    expect(screen.getByLabelText('카테고리 수정')).toHaveValue(
      '산리오 캐릭터즈, 마이멜로디, 캐릭터, 피규어',
    );
    expect(screen.getByText('작품: 산리오 캐릭터즈')).toBeVisible();
    expect(screen.getByText('캐릭터: 마이멜로디')).toBeVisible();

    await waitFor(() =>
      expect(screen.getByText(/이번 탭 1회 요청/)).toBeVisible(),
    );
  });

  it('AI가 제안한 새 카테고리는 관리자 확인 후 최종 저장 시 등록한다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    window.history.replaceState({}, '', '/classify/101');
    render(<App />);
    await screen.findByDisplayValue('귀여운 토끼 피규어');

    fireEvent.click(screen.getByRole('button', { name: 'AI 설정' }));
    fireEvent.change(screen.getByLabelText('개인 API 키'), {
      target: { value: 'test-gemini-key' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'AI 보조 켜기' }));
    await screen.findByText(/AI 추천을 입력했습니다/);

    fireEvent.click(screen.getByRole('button', { name: '저장 후 다음 →' }));

    expect(
      await screen.findByDisplayValue('로봇 전사 블루', {}, { timeout: 5_000 }),
    ).toBeVisible();
    const categories = await getCategories();
    expect(categories.map(({ name }) => name)).toEqual(
      expect.arrayContaining(['산리오 캐릭터즈', '마이멜로디']),
    );
  }, 10_000);

  it('분류 완료 목록에서 시작한 순서대로 수정하고 마지막에 목록으로 돌아온다', async () => {
    window.history.replaceState({}, '', '/classified');
    render(<App />);

    const itemName = await screen.findByText('산리오 미니 피규어');
    const itemRow = itemName.closest('li');
    expect(itemRow).not.toBeNull();
    fireEvent.click(
      within(itemRow!).getByRole('button', { name: '수정하기 →' }),
    );

    expect(
      await screen.findByRole('heading', { name: '분류 완료 데이터 수정' }),
    ).toBeVisible();
    const nameInput = screen.getByDisplayValue('산리오 미니 피규어');
    fireEvent.change(nameInput, { target: { value: '산리오 수정 피규어' } });
    expect(screen.getByText(/연속 수정 1\/3/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '저장 후 다음 →' }));

    expect(await screen.findByDisplayValue('건담 캡슐 피규어')).toBeVisible();
    expect(screen.getByText(/연속 수정 2\/3/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '저장 후 다음 →' }));

    const lastNameInput =
      await screen.findByDisplayValue('편의점 음식 미니어처');
    expect(screen.getByText(/연속 수정 3\/3/)).toBeVisible();
    fireEvent.change(lastNameInput, {
      target: { value: '편의점 음식 미니어처 수정' },
    });
    fireEvent.click(screen.getByRole('button', { name: '수정 저장 후 목록' }));

    expect(
      await screen.findByRole('heading', { name: '분류 완료 데이터' }),
    ).toBeVisible();
    expect(await screen.findByText('산리오 수정 피규어')).toBeVisible();
    expect(screen.getByText('편의점 음식 미니어처 수정')).toBeVisible();
  });

  it('현재 목록의 마지막 가챠를 저장하면 다음 페이지의 첫 가챠로 이어간다', async () => {
    for (let id = 200; id <= 247; id += 1) {
      classificationItems.push({
        gachaId: id,
        thumbnailUrl: '/mock/gacha-pink.svg',
        displayName: `경계 가챠 ${id}`,
        originalFileName: `boundary-${id}.jpg`,
        source: 'BANDAI',
        location: '홍대',
        caption: '페이지 경계 테스트 데이터',
        categoryIds: [5],
        status: 'CLASSIFIED',
        version: 1,
        createdAt: '2026-09-02T10:00:00+09:00',
      });
    }
    window.history.replaceState({}, '', '/classified');
    render(<App />);

    const boundaryItemName = await screen.findByText('경계 가챠 246');
    const boundaryItemRow = boundaryItemName.closest('li');
    expect(boundaryItemRow).not.toBeNull();
    fireEvent.click(
      within(boundaryItemRow!).getByRole('button', { name: '수정하기 →' }),
    );

    expect(await screen.findByDisplayValue('경계 가챠 246')).toBeVisible();
    expect(screen.getByText(/연속 수정 1\/1\+/)).toBeVisible();
    fireEvent.click(screen.getByRole('button', { name: '저장 후 다음 →' }));

    expect(await screen.findByDisplayValue('경계 가챠 247')).toBeVisible();
    expect(screen.getByText(/연속 수정 2\/2/)).toBeVisible();
    expect(
      screen.getByRole('button', { name: '수정 저장 후 목록' }),
    ).toBeVisible();
  });

  it('선택한 AI 서비스별 API 키 발급 순서와 공식 페이지를 안내한다', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: 'AI 설정' }));

    expect(
      screen.getByRole('button', { name: 'Google Gemini API 키 발급 안내' }),
    ).toBeVisible();
    expect(
      screen.getByText(/Google AI Studio API 키 페이지/).closest('a'),
    ).toHaveAttribute('href', 'https://aistudio.google.com/apikey');
    expect(screen.getByText(/AIza로 시작하는 키/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('AI 서비스'), {
      target: { value: 'OPENAI' },
    });

    expect(
      screen.getByRole('button', { name: 'OpenAI API 키 발급 안내' }),
    ).toBeVisible();
    expect(
      screen.getByText(/OpenAI API 키 페이지/).closest('a'),
    ).toHaveAttribute('href', 'https://platform.openai.com/api-keys');
    expect(screen.getByText(/sk-로 시작하는 키/)).toBeInTheDocument();
  });

  it('매장을 선택해 분류 완료 가챠를 등록하고 중복 등록을 막는다', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /매장 가챠 관리/ }));
    expect(
      await screen.findByRole('heading', { name: '매장 가챠 관리' }),
    ).toBeVisible();

    fireEvent.click(
      await screen.findByRole('button', {
        name: '캡슐 스테이션 연남 보유 가챠 관리',
      }),
    );
    expect(
      await screen.findByRole('heading', { name: '캡슐 스테이션 연남' }),
    ).toBeVisible();

    const catalogName = await screen.findByText('산리오 미니 피규어');
    const catalogRow = catalogName.closest('li');
    expect(catalogRow).not.toBeNull();
    fireEvent.click(
      within(catalogRow!).getByRole('button', { name: '매장에 추가' }),
    );

    expect(
      await screen.findByText('가챠 #105을(를) 매장에 등록했습니다.'),
    ).toBeVisible();
    expect(
      within(catalogRow!).getByRole('button', { name: '매장에서 제거' }),
    ).toBeVisible();
    expect(
      screen.getByText('현재 보유 가챠').previousSibling,
    ).toHaveTextContent('1');
  }, 10_000);
});
