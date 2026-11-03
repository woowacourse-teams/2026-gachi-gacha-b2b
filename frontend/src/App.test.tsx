import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
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
import {
  getCategories,
  getClassificationItem,
} from '@/features/classification/api/classificationApi';
import {
  classificationItems,
  resetMockData,
  storeGachaAssignments,
} from '@/mocks/data';
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

  it('매장 썸네일 URL이 실패하면 기본 표시로 대체한다', async () => {
    window.history.replaceState({}, '', '/stores');
    render(<App />);

    const storeButton = await screen.findByRole('button', {
      name: '가챠샵 홍대점 보유 가챠 관리',
    });
    const thumbnail = storeButton.querySelector('img');
    expect(thumbnail).not.toBeNull();
    fireEvent.error(thumbnail!);

    expect(within(storeButton).getByText('店')).toBeVisible();
  });

  it('분류 화면에서 이름과 카테고리를 직접 편집해 저장한다', async () => {
    window.history.replaceState({}, '', '/classify/101');
    render(<App />);

    expect(await screen.findByDisplayValue('귀여운 토끼 피규어')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'AI 설정' })).toBeNull();
    fireEvent.change(screen.getByDisplayValue('귀여운 토끼 피규어'), {
      target: { value: '직접 수정한 토끼 피규어' },
    });
    fireEvent.change(screen.getByLabelText('카테고리 수정'), {
      target: { value: '캐릭터, 피규어' },
    });
    fireEvent.click(screen.getByRole('button', { name: '저장 후 다음 →' }));

    expect(
      await screen.findByDisplayValue('로봇 전사 블루', {}, { timeout: 5_000 }),
    ).toBeVisible();
    expect(await getClassificationItem(101)).toMatchObject({
      name: '직접 수정한 토끼 피규어',
      categoryIds: [3, 5],
    });
  }, 10_000);

  it('직접 입력한 새 카테고리는 확인 후 최종 저장 시 등록한다', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    window.history.replaceState({}, '', '/classify/101');
    render(<App />);
    await screen.findByDisplayValue('귀여운 토끼 피규어');

    fireEvent.change(screen.getByLabelText('카테고리 수정'), {
      target: { value: '산리오 캐릭터즈, 마이멜로디, 캐릭터, 피규어' },
    });
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
  }, 15_000);

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
    expect(
      screen.getByRole('textbox', {
        name: '가챠 이름 또는 카테고리 검색',
      }),
    ).toHaveAttribute('placeholder', '가챠 이름 또는 카테고리명 검색');

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
      screen.getByText('등록 가챠 종류').previousSibling,
    ).toHaveTextContent('1');

    const assignedSection = screen.getByRole('region', {
      name: '매장에 등록된 가챠',
    });
    fireEvent.change(
      screen.getByRole('textbox', { name: '가챠 이름 또는 카테고리 검색' }),
      { target: { value: '건담' } },
    );
    expect(
      await within(assignedSection).findByText('산리오 미니 피규어'),
    ).toBeVisible();
    expect(
      await within(assignedSection).findByText(/카탈로그 등록일/),
    ).toBeVisible();
  }, 10_000);

  it('매장에 연결된 가챠가 미분류가 되어도 등록 목록에서 이름을 유지한다', async () => {
    const item = classificationItems.find(({ gachaId }) => gachaId === 105);
    expect(item).toBeDefined();
    item!.categoryIds = [];
    item!.status = 'UNCLASSIFIED';
    window.history.replaceState({}, '', '/stores/1/gachas');
    render(<App />);

    const assignedSection = await screen.findByRole('region', {
      name: '매장에 등록된 가챠',
    });
    expect(
      await within(assignedSection).findByText('산리오 미니 피규어'),
    ).toBeVisible();
  });

  it('등록된 가챠 종류를 이름·카테고리로 찾고 ID순으로 정렬한다', async () => {
    storeGachaAssignments.get(1)?.add(107);
    window.history.replaceState({}, '', '/stores/1/gachas');
    render(<App />);

    const assignedSection = await screen.findByRole('region', {
      name: '매장에 등록된 가챠',
    });
    expect(
      await within(assignedSection).findByText('건담 캡슐 피규어'),
    ).toBeVisible();
    await waitFor(() => {
      expect(
        within(assignedSection).getByRole('button', { name: '전체 종류 CSV' }),
      ).toBeEnabled();
    });

    fireEvent.change(within(assignedSection).getByLabelText('등록 가챠 검색'), {
      target: { value: '산 리오' },
    });
    expect(
      within(assignedSection).getByText('산리오 미니 피규어'),
    ).toBeVisible();
    expect(within(assignedSection).queryByText('건담 캡슐 피규어')).toBeNull();

    fireEvent.change(within(assignedSection).getByLabelText('등록 가챠 검색'), {
      target: { value: '' },
    });
    fireEvent.change(within(assignedSection).getByLabelText('카테고리'), {
      target: { value: '2' },
    });
    expect(
      within(assignedSection).getByText('산리오 미니 피규어'),
    ).toBeVisible();
    expect(within(assignedSection).queryByText('건담 캡슐 피규어')).toBeNull();

    fireEvent.change(within(assignedSection).getByLabelText('카테고리'), {
      target: { value: '' },
    });
    fireEvent.change(within(assignedSection).getByLabelText('정렬'), {
      target: { value: 'id' },
    });
    expect(
      within(assignedSection).getAllByRole('listitem')[0],
    ).toHaveTextContent('DB ID #105');
  });

  it('등록 가챠 상세조회가 실패하면 CSV를 막고 재시도할 수 있다', async () => {
    server.use(
      http.get(`${__BFF_API_BASE_URL__}/catalog-items`, () =>
        HttpResponse.json({ message: '조회 실패' }, { status: 502 }),
      ),
    );
    window.history.replaceState({}, '', '/stores/1/gachas');
    render(<App />);

    const assignedSection = await screen.findByRole('region', {
      name: '매장에 등록된 가챠',
    });
    expect(await within(assignedSection).findByText(/조회 실패/)).toBeVisible();
    expect(
      within(assignedSection).getByRole('button', { name: '전체 종류 CSV' }),
    ).toBeDisabled();

    server.resetHandlers();
    fireEvent.click(
      within(assignedSection).getByRole('button', { name: '다시 시도' }),
    );
    expect(
      await within(assignedSection).findByText('산리오 미니 피규어'),
    ).toBeVisible();
    await waitFor(() => {
      expect(
        within(assignedSection).getByRole('button', { name: '전체 종류 CSV' }),
      ).toBeEnabled();
    });
  });

  it('다른 관리자가 등록한 가챠 종류를 새로고침으로 확인한다', async () => {
    window.history.replaceState({}, '', '/stores/1/gachas');
    render(<App />);

    const assignedSection = await screen.findByRole('region', {
      name: '매장에 등록된 가챠',
    });
    expect(
      await within(assignedSection).findByText('산리오 미니 피규어'),
    ).toBeVisible();

    storeGachaAssignments.get(1)?.add(107);
    fireEvent.click(
      within(assignedSection).getByRole('button', { name: '목록 새로고침' }),
    );

    expect(
      await within(assignedSection).findByText('건담 캡슐 피규어'),
    ).toBeVisible();
    expect(within(assignedSection).getByText(/마지막 목록 조회/)).toBeVisible();
  });

  it('보강 시트 정보의 한·일 이름과 캐릭터를 보여주고 별칭으로 등록 목록을 찾는다', async () => {
    server.use(
      http.get(`${__BFF_API_BASE_URL__}/catalog-items`, () =>
        HttpResponse.json({
          items: [
            {
              gachaId: 105,
              name: '산리오 미니 피규어',
              caption: '',
              thumbnailUrl: '/mock/gacha-pink.svg',
              productCode: 'sanrio-105.jpg',
              categories: ['캐릭터', '피규어'],
              source: 'BANDAI',
              createdAt: '2026-09-01T00:00:00+09:00',
              metadata: {
                nameKo: '산리오 친구들',
                nameJa: 'サンリオフレンズ',
                aliases: ['헬로키티'],
                work: '산리오',
                series: '미니 피규어',
                characters: ['시나모롤'],
                reviewedAt: '2026-11-01',
              },
            },
          ],
          metadataStatus: 'stale',
          metadataAsOf: '2026-11-01T00:00:00.000Z',
        }),
      ),
    );
    window.history.replaceState({}, '', '/stores/1/gachas');
    render(<App />);

    const assignedSection = await screen.findByRole('region', {
      name: '매장에 등록된 가챠',
    });
    expect(
      await within(assignedSection).findByText('산리오 친구들'),
    ).toBeVisible();
    expect(
      within(assignedSection).getByText('일본어 サンリオフレンズ'),
    ).toBeVisible();
    expect(within(assignedSection).getByText(/캐릭터 시나모롤/)).toBeVisible();
    expect(
      within(assignedSection).getByText(/이전 정보를 표시합니다/),
    ).toBeVisible();

    fireEvent.change(within(assignedSection).getByLabelText('등록 가챠 검색'), {
      target: { value: '헬로 키티' },
    });
    expect(within(assignedSection).getByText('산리오 친구들')).toBeVisible();
  });

  it('쿠지 기록 양식은 저장·동기화 현황판이 아님을 명시한다', async () => {
    window.history.replaceState({}, '', '/stores/1/gachas');
    render(<App />);

    const kujiSection = await screen.findByRole('region', {
      name: '쿠지 현장 기록 준비',
    });
    expect(
      within(kujiSection).getByRole('button', { name: '쿠지 기록 양식 CSV' }),
    ).toBeEnabled();
    expect(
      within(kujiSection).getByText(/사이트에 저장·동기화되지 않고/),
    ).toBeVisible();
  });

  it('새 매장을 등록한 뒤 해당 매장의 가챠 관리로 바로 이어간다', async () => {
    window.history.replaceState({}, '', '/stores');
    render(<App />);

    fireEvent.click(
      await screen.findByRole('button', { name: /새 매장 등록/ }),
    );
    expect(screen.getByRole('heading', { name: '새 매장 등록' })).toBeVisible();

    fireEvent.change(screen.getByLabelText(/매장 이름/), {
      target: { value: '캡슐 스테이션 성수' },
    });
    fireEvent.change(screen.getByLabelText(/^주소/), {
      target: { value: '서울특별시 성동구 연무장길 1' },
    });
    fireEvent.change(screen.getByLabelText(/위도/), {
      target: { value: '37.5445' },
    });
    fireEvent.change(screen.getByLabelText(/경도/), {
      target: { value: '127.0561' },
    });
    fireEvent.change(screen.getByLabelText('가챠 기계 수'), {
      target: { value: '18' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: '매장 등록 후 가챠 관리' }),
    );

    expect(
      await screen.findByRole('heading', { name: '캡슐 스테이션 성수' }),
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
  }, 10_000);

  it('매장 등록의 선택 정보는 접어 두고 오류가 있으면 해당 영역을 연다', () => {
    window.history.replaceState({}, '', '/stores/new');
    render(<App />);

    const operationsSummary = screen.getByText(
      '가챠·쿠지 운영 정보 입력 (선택)',
    );
    const operationsDetails = operationsSummary.closest('details');
    expect(operationsDetails).not.toBeNull();
    expect(operationsDetails).not.toHaveAttribute('open');

    fireEvent.click(operationsSummary);
    fireEvent.change(screen.getByLabelText('쿠지 최소 가격'), {
      target: { value: '10000' },
    });
    fireEvent.change(screen.getByLabelText('쿠지 최대 가격'), {
      target: { value: '5000' },
    });
    fireEvent.click(operationsSummary);
    expect(operationsDetails).not.toHaveAttribute('open');

    fireEvent.click(
      screen.getByRole('button', { name: '매장 등록 후 가챠 관리' }),
    );
    expect(operationsDetails).toHaveAttribute('open');
    expect(document.getElementById('store-kujiPriceMax')).toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('매장에 추가할 가챠의 섬네일을 확대하고 Escape로 닫는다', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /매장 가챠 관리/ }));
    fireEvent.click(
      await screen.findByRole('button', {
        name: '캡슐 스테이션 연남 보유 가챠 관리',
      }),
    );

    const previewButton = await screen.findByRole(
      'button',
      { name: '가챠 #105 산리오 미니 피규어 이미지 확대' },
      { timeout: 5_000 },
    );
    previewButton.focus();
    fireEvent.click(previewButton);

    expect(screen.getByRole('dialog')).toHaveAccessibleName(
      '산리오 미니 피규어',
    );
    expect(
      screen.getByRole('img', { name: '산리오 미니 피규어 확대 이미지' }),
    ).toHaveAttribute('src', '/mock/gacha-pink.svg');
    expect(screen.getByText('DB ID #105')).toBeVisible();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(previewButton).toHaveFocus();
  }, 10_000);

  it('가챠 이미지가 실패하면 깨진 이미지 대신 안내를 표시한다', async () => {
    window.history.replaceState({}, '', '/stores/3/gachas');
    render(<App />);

    const previewButton = await screen.findByRole(
      'button',
      { name: '가챠 #105 산리오 미니 피규어 이미지 확대' },
      { timeout: 5_000 },
    );
    fireEvent.click(previewButton);
    const previewImage = screen.getByRole('img', {
      name: '산리오 미니 피규어 확대 이미지',
    });
    fireEvent.error(previewImage);

    expect(screen.getByText(/이미지를 불러오지 못했습니다/)).toBeVisible();
    expect(
      screen.getByRole('button', { name: '가챠 #105 이미지 없음' }),
    ).toBeDisabled();
  });

  it('매장 가챠 검색어와 카테고리 변경을 즉시 결과에 반영한다', async () => {
    render(<App />);

    fireEvent.click(screen.getByRole('button', { name: /매장 가챠 관리/ }));
    fireEvent.click(
      await screen.findByRole('button', {
        name: '캡슐 스테이션 연남 보유 가챠 관리',
      }),
    );

    const queryInput = await screen.findByRole('textbox', {
      name: '가챠 이름 또는 카테고리 검색',
    });
    expect(await screen.findByText('산리오 미니 피규어')).toBeVisible();

    fireEvent.change(queryInput, { target: { value: '산리오' } });
    expect(screen.queryByText('산리오 미니 피규어')).not.toBeInTheDocument();
    expect(
      screen.getByText('입력한 검색어를 적용하고 있습니다.'),
    ).toBeVisible();
    expect(await screen.findByText('산리오 미니 피규어')).toBeVisible();

    fireEvent.change(queryInput, { target: { value: '건담' } });
    expect(screen.queryByText('산리오 미니 피규어')).not.toBeInTheDocument();
    expect(await screen.findByText('건담 캡슐 피규어')).toBeVisible();
    expect(screen.queryByText('산리오 미니 피규어')).not.toBeInTheDocument();
    expect(screen.getByText('총 1개 중 1개 표시')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '필터 초기화' }));
    expect(await screen.findByText('편의점 음식 미니어처')).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '미니어처' }));
    expect(screen.queryByText('산리오 미니 피규어')).not.toBeInTheDocument();
    expect(await screen.findByText('편의점 음식 미니어처')).toBeVisible();
    expect(screen.getByText('총 1개 중 1개 표시')).toBeVisible();
  }, 10_000);

  it('매장 가챠 화면에서 기기·쿠지 운영 시안을 열고 돌아온다', async () => {
    window.history.replaceState({}, '', '/stores/1/gachas');
    render(<App />);

    fireEvent.click(
      await screen.findByRole('button', {
        name: '기기 배치·쿠지 현황판 시안 보기 →',
      }),
    );

    expect(
      await screen.findByRole('heading', { name: '가챠샵 홍대점 운영 보드' }),
    ).toBeVisible();
    expect(window.location.pathname).toBe('/stores/1/operations-preview');
    expect(screen.getByText(/서버에 저장되지 않는 체험용 초안/)).toBeVisible();
    expect(
      screen.getByRole('heading', { name: '기기 배치 초안' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', { name: '쿠지 현황판 초안' }),
    ).toBeVisible();

    fireEvent.click(screen.getByRole('button', { name: '← 보유 가챠 관리로' }));
    expect(
      await screen.findByRole('heading', { name: '가챠샵 홍대점' }),
    ).toBeVisible();
    expect(window.location.pathname).toBe('/stores/1/gachas');
  }, 10_000);
});
