import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MachinePlacementDraft from './MachinePlacementDraft';

const gachas = [
  {
    id: 1697,
    name: '메지루시 악세사리 산리오 캐릭터즈 2',
    nameJa: 'めじるしアクセサリー',
    imageUrl: '/mock/gacha-1697.jpg',
  },
  { id: 1698, name: '다른 가챠', imageUrl: '/mock/gacha-1698.jpg' },
];

const renderDraft = (storeId = 3, storeCoinPrice = 1000) =>
  render(
    <MachinePlacementDraft
      gachas={gachas}
      machineCount={12}
      storeCoinPrice={storeCoinPrice}
      storeId={storeId}
      storeName="연남점"
    />,
  );

const setGroupCount = (coins: string, count: string) => {
  const input = document.getElementById('machine-count-' + coins);
  if (!input) throw new Error(coins + '코인 기기 대수 입력칸이 없습니다.');
  fireEvent.change(input, { target: { value: count } });
  fireEvent.blur(input);
};

const machinePicker = (ordinal = 1) =>
  screen.getByRole('region', {
    name: `4코인 · ${ordinal}번 기기에 넣을 가챠 선택`,
  });

const groupButton = (coins: string) =>
  screen.getByRole('button', { name: new RegExp(coins + '\\s*코인 기기') });

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('매장 기기 배치 시안', () => {
  it('저장되지 않는 빈 초안으로 시작하고 기기 코드를 요구하지 않는다', () => {
    renderDraft();

    expect(screen.getByText('시안 · 서버 저장 안 됨')).toBeInTheDocument();
    expect(screen.getByRole('note')).toHaveTextContent(
      '새로고침하거나 화면을 떠나면 사라집니다.',
    );
    expect(screen.getByLabelText(/매장 공통 코인 단가/)).toHaveValue('1000');
    expect(screen.getByText(/기존 매장 정보의 기계 수는/)).toHaveTextContent(
      '현재 설정한 기기는 0대입니다.',
    );
    expect(screen.queryByLabelText(/기기 코드/)).not.toBeInTheDocument();
    expect(document.querySelector('select')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: '배치 초안 CSV 내려받기' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      '기기 대수를 설정하거나 보관 품목을 추가해 주세요.',
    );
  });

  it('코인 수별 대수와 가격을 일괄 적용하고 사진에서 가챠를 한 번에 배치한다', () => {
    renderDraft();
    setGroupCount('4', '2');

    expect(groupButton('4')).toHaveTextContent('2대 중 0대 배치');
    expect(groupButton('4')).toHaveTextContent('회당 4,000원');
    expect(
      screen.getByRole('button', { name: /4코인 · 1번 기기/ }),
    ).toBeInTheDocument();
    expect(machinePicker().querySelector('img')).toHaveAttribute(
      'src',
      '/mock/gacha-1697.jpg',
    );

    fireEvent.click(
      within(machinePicker()).getByRole('button', {
        name: /메지루시 악세사리 산리오 캐릭터즈 2/,
      }),
    );
    expect(groupButton('4')).toHaveTextContent('2대 중 1대 배치');
    expect(screen.getByText('4코인 · 1번 기기 상세')).toBeInTheDocument();
    expect(screen.getByText('회당 가격 4,000원')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/매장 공통 코인 단가/), {
      target: { value: '1500' },
    });
    expect(screen.getByText('회당 가격 6,000원')).toBeInTheDocument();
    expect(groupButton('4')).toHaveTextContent('회당 6,000원');
  });

  it('이름·일본어 이름·ID를 검색하며 사진이 없을 때도 고를 수 있다', () => {
    renderDraft();
    setGroupCount('4', '1');
    const search = within(machinePicker()).getByRole('textbox', {
      name: '매장 등록 가챠 검색',
    });

    fireEvent.change(search, { target: { value: '１６９７' } });
    expect(within(machinePicker()).getAllByRole('button')).toHaveLength(1);
    fireEvent.change(search, { target: { value: 'めじるし' } });
    expect(within(machinePicker()).getAllByRole('button')).toHaveLength(1);
    fireEvent.change(search, { target: { value: '없는 상품' } });
    expect(
      within(machinePicker()).getByText('검색 결과가 없습니다.'),
    ).toBeInTheDocument();
    fireEvent.change(search, { target: { value: '' } });

    const image = machinePicker().querySelector('img');
    if (!image) throw new Error('가챠 이미지가 없습니다.');
    fireEvent.error(image);
    expect(within(machinePicker()).getByText('사진 없음')).toBeInTheDocument();
    fireEvent.click(
      within(machinePicker()).getByRole('button', {
        name: /메지루시 악세사리 산리오 캐릭터즈 2/,
      }),
    );
    expect(screen.getByText('회당 가격 4,000원')).toBeInTheDocument();
  });

  it('내용이 있는 기기 대수를 줄이기 전에 확인받고 취소하면 유지한다', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderDraft();
    setGroupCount('4', '2');
    fireEvent.click(screen.getByRole('button', { name: /4코인 · 2번 기기/ }));
    fireEvent.click(
      within(machinePicker(2)).getByRole('button', { name: /다른 가챠/ }),
    );

    setGroupCount('4', '1');
    expect(confirm).toHaveBeenCalledWith(
      '줄어드는 기기에 적힌 가챠·위치·수량 초안이 사라집니다. 계속할까요?',
    );
    expect(
      screen.getByRole('button', { name: /4코인 · 2번 기기/ }),
    ).toBeInTheDocument();
    expect(document.getElementById('machine-count-4')).toHaveValue('2');

    confirm.mockReturnValue(true);
    setGroupCount('4', '1');
    expect(
      screen.queryByRole('button', { name: /4코인 · 2번 기기/ }),
    ).not.toBeInTheDocument();
  });

  it('커스텀 코인 기기를 지원하고 매장을 바꾸면 미저장 입력을 초기화한다', () => {
    const view = renderDraft();
    fireEvent.change(screen.getByPlaceholderText('예: 10 또는 18'), {
      target: { value: '18' },
    });
    fireEvent.click(screen.getByRole('button', { name: '+ 기기 종류 추가' }));
    setGroupCount('18', '1');
    expect(groupButton('18')).toHaveTextContent('1대 중 0대 배치');
    expect(groupButton('18')).toHaveTextContent('회당 18,000원');

    view.rerender(
      <MachinePlacementDraft
        gachas={gachas}
        machineCount={2}
        storeCoinPrice={800}
        storeId={4}
        storeName="홍대점"
      />,
    );
    expect(
      screen.queryByRole('button', { name: /18\s*코인 기기/ }),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText(/매장 공통 코인 단가/)).toHaveValue('800');
    expect(screen.getByText(/기존 매장 정보의 기계 수는/)).toHaveTextContent(
      '현재 설정한 기기는 0대입니다.',
    );
  });

  it('기기 없이 보관 품목을 사진에서 고를 수 있고 CSV는 미저장 상태로만 내려받는다', () => {
    const createObjectURL = vi.fn(() => 'blob:machine-draft');
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL,
      revokeObjectURL: vi.fn(),
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});
    renderDraft();

    fireEvent.click(screen.getByRole('button', { name: '+ 보관 가챠 고르기' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: '메지루시 악세사리 산리오 캐릭터즈 2 보관 품목 추가',
      }),
    );
    fireEvent.change(
      screen.getByRole('textbox', {
        name: /#1697 메지루시 악세사리 산리오 캐릭터즈 2 보관 수량/,
      }),
      { target: { value: '24' } },
    );
    fireEvent.click(
      screen.getByRole('button', { name: '배치 초안 CSV 내려받기' }),
    );

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent(
      '파일을 수정해도 사이트나 소비자 화면에는 반영되지 않습니다.',
    );
  });
});
