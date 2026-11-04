import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MachinePlacementDraft from './MachinePlacementDraft';
import { createMachinePlacementDraftCsv } from '../model/machinePlacementDraftCsv';

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
  screen.getByRole('dialog', {
    name: `4코인 · ${ordinal}번 기기에 넣을 가챠 선택`,
  });

const openMachinePicker = (ordinal = 1) => {
  fireEvent.click(screen.getByRole('button', { name: '가챠 넣기' }));
  return machinePicker(ordinal);
};

const groupButton = (coins: string) =>
  screen.getByRole('button', { name: new RegExp(coins + '\\s*코인 기기') });

const machineTile = (ordinal = 1) =>
  screen.getByRole('button', {
    name: new RegExp(`^4코인 · ${ordinal}번 기기`),
  });

const importFixture = (storeId = 3) =>
  createMachinePlacementDraftCsv(
    storeId,
    '연남점',
    [
      {
        key: '7',
        machineLabel: '4코인 · 1번 기기',
        coinsPerPlay: '4',
        area: '입구, 오른쪽',
        tier: '2',
        gachaId: '1697',
        quantity: '8',
      },
    ],
    gachas,
    '1200',
    { 1697: '5', 1698: '2' },
    [1698],
    ['10'],
  );

const csvFile = (csv: string, name = 'machine-placement-draft.csv') => {
  const file = new File([csv], name, { type: 'text/csv' });
  Object.defineProperty(file, 'arrayBuffer', {
    configurable: true,
    value: vi.fn().mockResolvedValue(new TextEncoder().encode(csv).buffer),
  });
  return file;
};

const uploadCsv = (file: File) =>
  fireEvent.change(screen.getByLabelText(/초안 CSV 파일 선택/), {
    target: { files: [file] },
  });

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
    expect(machineTile()).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(openMachinePicker().querySelector('img')).toHaveAttribute(
      'src',
      '/mock/gacha-1697.jpg',
    );

    fireEvent.click(
      within(machinePicker()).getByRole('button', {
        name: /메지루시 악세사리 산리오 캐릭터즈 2.*배치/,
      }),
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(groupButton('4')).toHaveTextContent('2대 중 1대 배치');
    expect(screen.getByText('4코인 · 1번 기기 상세')).toBeInTheDocument();
    expect(screen.getByText('회당 가격 4,000원')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '가챠 바꾸기' }),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/매장 공통 코인 단가/), {
      target: { value: '1500' },
    });
    expect(screen.getByText('회당 가격 6,000원')).toBeInTheDocument();
    expect(groupButton('4')).toHaveTextContent('회당 6,000원');
  });

  it('이름·일본어 이름·ID를 검색하며 사진이 없을 때도 고를 수 있다', () => {
    renderDraft();
    setGroupCount('4', '1');
    openMachinePicker();
    const search = within(machinePicker()).getByRole('textbox', {
      name: '매장 등록 가챠 검색',
    });

    fireEvent.change(search, { target: { value: '１６９７' } });
    expect(
      within(machinePicker()).getAllByRole('button', { name: /배치/ }),
    ).toHaveLength(1);
    fireEvent.change(search, { target: { value: 'めじるし' } });
    expect(
      within(machinePicker()).getAllByRole('button', { name: /배치/ }),
    ).toHaveLength(1);
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
        name: /메지루시 악세사리 산리오 캐릭터즈 2.*배치/,
      }),
    );
    expect(screen.getByText('회당 가격 4,000원')).toBeInTheDocument();
  });

  it('기기 카드 클릭은 상세만 전환하고 가챠 검색은 명시적으로 연다', () => {
    renderDraft();
    setGroupCount('4', '2');

    const first = machineTile();
    const second = machineTile(2);
    const scrollIntoView = vi.fn();
    const originalScrollIntoView = HTMLElement.prototype.scrollIntoView;
    HTMLElement.prototype.scrollIntoView = scrollIntoView;

    try {
      fireEvent.change(screen.getByLabelText('매장 내 구역 (선택)'), {
        target: { value: '입구 오른쪽' },
      });
      fireEvent.click(second);
      expect(second).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByText('4코인 · 2번 기기 상세')).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(scrollIntoView).not.toHaveBeenCalled();

      fireEvent.click(first);
      expect(screen.getByLabelText('매장 내 구역 (선택)')).toHaveValue(
        '입구 오른쪽',
      );
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      openMachinePicker();
      expect(machinePicker()).toBeInTheDocument();
      fireEvent.click(second);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.getByText('4코인 · 2번 기기 상세')).toBeInTheDocument();
    } finally {
      HTMLElement.prototype.scrollIntoView = originalScrollIntoView;
    }
  });

  it('선택한 기기가 화면 밖이면 보이는 가챠 넣기 버튼 아래에 검색창을 띄운다', () => {
    renderDraft();
    setGroupCount('4', '1');
    vi.stubGlobal('innerWidth', 1200);
    vi.stubGlobal('innerHeight', 900);

    const tile = machineTile();
    const trigger = screen.getByRole('button', { name: '가챠 넣기' });
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const rect = (top: number, bottom: number): DOMRect =>
      ({
        x: 40,
        y: top,
        width: 200,
        height: bottom - top,
        top,
        right: 240,
        bottom,
        left: 40,
        toJSON: () => ({}),
      }) as DOMRect;
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
      function (this: HTMLElement) {
        if (this === tile) return rect(-500, -400);
        if (this === trigger) return rect(180, 220);
        return originalRect.call(this);
      },
    );

    fireEvent.click(trigger);
    const picker = machinePicker();
    const top = Number.parseFloat(picker.style.top);
    const maxHeight = Number.parseFloat(picker.style.maxHeight);

    expect(top).toBe(228);
    expect(top).toBeGreaterThanOrEqual(16);
    expect(top + maxHeight).toBeLessThanOrEqual(window.innerHeight - 16);
  });

  it('가챠 섬네일은 확대만 하고 카드의 배치 버튼은 기기에 배치한다', () => {
    renderDraft();
    setGroupCount('4', '1');
    openMachinePicker();

    fireEvent.click(
      within(machinePicker()).getByRole('button', {
        name: '메지루시 악세사리 산리오 캐릭터즈 2 이미지 확대',
      }),
    );
    expect(
      screen.getByRole('dialog', {
        name: '메지루시 악세사리 산리오 캐릭터즈 2',
      }),
    ).toBeInTheDocument();
    expect(groupButton('4')).toHaveTextContent('1대 중 0대 배치');
    expect(machinePicker()).toBeInTheDocument();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(
      screen.queryByRole('dialog', {
        name: '메지루시 악세사리 산리오 캐릭터즈 2',
      }),
    ).not.toBeInTheDocument();
    expect(machinePicker()).toBeInTheDocument();

    fireEvent.click(
      within(machinePicker()).getByRole('button', {
        name: '메지루시 악세사리 산리오 캐릭터즈 2 이미지 확대',
      }),
    );
    const closePreview = screen.getByRole('button', {
      name: '확대 이미지 닫기',
    });
    fireEvent.pointerDown(closePreview);
    fireEvent.click(closePreview);
    expect(machinePicker()).toBeInTheDocument();
    expect(groupButton('4')).toHaveTextContent('1대 중 0대 배치');

    fireEvent.click(
      within(machinePicker()).getByRole('button', {
        name: /메지루시 악세사리 산리오 캐릭터즈 2.*배치/,
      }),
    );
    expect(groupButton('4')).toHaveTextContent('1대 중 1대 배치');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('가챠 선택창을 Escape로 닫으면 열었던 버튼으로 포커스가 돌아간다', () => {
    renderDraft();
    setGroupCount('4', '1');
    const trigger = screen.getByRole('button', { name: '가챠 넣기' });

    fireEvent.click(trigger);
    expect(machinePicker()).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(
      within(machinePicker()).getByRole('textbox', {
        name: '매장 등록 가챠 검색',
      }),
    ).toHaveFocus();
    fireEvent.keyDown(machinePicker(), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(groupButton('4')).toHaveTextContent('1대 중 0대 배치');
  });

  it('기기 목록의 빠른 버튼으로 선택한 기기의 검색창을 열고 Escape 후 버튼으로 돌아간다', () => {
    renderDraft();
    setGroupCount('4', '2');
    fireEvent.click(machineTile(2));
    const quickButton = screen.getByRole('button', {
      name: '선택한 4코인 · 2번 기기에 가챠 넣기',
    });

    fireEvent.click(quickButton);
    expect(machinePicker(2)).toBeInTheDocument();
    expect(quickButton).toHaveAttribute('aria-expanded', 'true');
    expect(
      within(machinePicker(2)).getByRole('textbox', {
        name: '매장 등록 가챠 검색',
      }),
    ).toHaveFocus();

    fireEvent.keyDown(machinePicker(2), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(quickButton).toHaveFocus();
    expect(quickButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('상세 버튼과 빠른 버튼을 교차해서 눌러도 검색창이 닫히고 누른 버튼으로 돌아간다', async () => {
    renderDraft();
    setGroupCount('4', '1');
    const detailButton = screen.getByRole('button', { name: '가챠 넣기' });
    const quickButton = screen.getByRole('button', {
      name: '선택한 4코인 · 1번 기기에 가챠 넣기',
    });

    fireEvent.click(detailButton);
    expect(machinePicker()).toBeInTheDocument();
    fireEvent.pointerDown(quickButton);
    fireEvent.click(quickButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(quickButton).toHaveFocus());

    fireEvent.click(quickButton);
    expect(machinePicker()).toBeInTheDocument();
    fireEvent.pointerDown(detailButton);
    fireEvent.click(detailButton);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(detailButton).toHaveFocus());
  });

  it('빈 영역을 눌러 검색창을 닫으면 열었던 버튼으로 포커스가 돌아간다', async () => {
    renderDraft();
    setGroupCount('4', '1');
    const trigger = screen.getByRole('button', { name: '가챠 넣기' });
    fireEvent.click(trigger);
    expect(machinePicker()).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole('heading', { name: '4코인 기기' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('가챠 없이 기기 수량을 적은 뒤 CSV를 내보내면 검색창에서 오류를 바로 고칠 수 있다', async () => {
    renderDraft();
    setGroupCount('4', '1');
    fireEvent.change(screen.getByLabelText(/기기 내 확인 수량/), {
      target: { value: '5' },
    });

    fireEvent.click(
      screen.getByRole('button', { name: '배치 초안 CSV 내려받기' }),
    );

    const picker = machinePicker();
    expect(screen.getByRole('alert')).toHaveTextContent(
      '가챠 선택과 기기·보관 수량을 확인해 주세요.',
    );
    expect(picker).toHaveTextContent(
      '기기 수량을 적으려면 먼저 가챠를 배치해 주세요.',
    );
    await waitFor(() =>
      expect(
        within(picker).getByRole('textbox', { name: '매장 등록 가챠 검색' }),
      ).toHaveFocus(),
    );
  });

  it('빈 기기 그룹에서 다른 그룹의 CSV 오류로 검색창이 열려도 Escape 포커스가 복귀한다', () => {
    renderDraft();
    setGroupCount('6', '1');
    fireEvent.click(groupButton('6'));
    fireEvent.change(screen.getByLabelText(/기기 내 확인 수량/), {
      target: { value: '3' },
    });
    fireEvent.click(groupButton('4'));
    expect(
      screen.queryByRole('button', { name: '가챠 넣기' }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: '배치 초안 CSV 내려받기' }),
    );

    const picker = screen.getByRole('dialog', {
      name: '6코인 · 1번 기기에 넣을 가챠 선택',
    });
    expect(
      within(picker).getByRole('textbox', { name: '매장 등록 가챠 검색' }),
    ).toHaveFocus();
    const detailTrigger = screen.getByRole('button', { name: '가챠 넣기' });

    fireEvent.keyDown(picker, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(detailTrigger).toHaveFocus();
  });

  it('내용이 있는 기기 대수를 줄이기 전에 확인받고 취소하면 유지한다', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderDraft();
    setGroupCount('4', '2');
    fireEvent.click(machineTile(2));
    openMachinePicker(2);
    fireEvent.click(
      within(machinePicker(2)).getByRole('button', { name: /다른 가챠.*배치/ }),
    );

    setGroupCount('4', '1');
    expect(confirm).toHaveBeenCalledWith(
      '줄어드는 기기에 적힌 가챠·위치·수량 초안이 사라집니다. 계속할까요?',
    );
    expect(machineTile(2)).toBeInTheDocument();
    expect(document.getElementById('machine-count-4')).toHaveValue('2');

    confirm.mockReturnValue(true);
    setGroupCount('4', '1');
    expect(
      screen.queryByRole('button', { name: /^4코인 · 2번 기기/ }),
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

  it('같은 매장의 CSV에서 코인 단가·기기 배치·보관 수량·빈 기기 종류를 복원한다', async () => {
    renderDraft();
    uploadCsv(csvFile(importFixture()));

    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'CSV 초안을 불러왔습니다.',
      ),
    );
    expect(screen.getByLabelText(/매장 공통 코인 단가/)).toHaveValue('1200');
    expect(groupButton('4')).toHaveTextContent('1대 중 1대 배치');
    expect(groupButton('4')).toHaveTextContent('회당 4,800원');
    expect(groupButton('10')).toHaveTextContent('0대 중 0대 배치');
    expect(screen.getByLabelText('매장 내 구역 (선택)')).toHaveValue(
      '입구, 오른쪽',
    );
    expect(screen.getByLabelText('설치 단 (선택)')).toHaveValue('2');
    expect(screen.getByLabelText(/기기 내 확인 수량/)).toHaveValue('8');
    fireEvent.click(screen.getByRole('button', { name: '가챠 바꾸기' }));
    expect(
      within(machinePicker()).getByRole('button', {
        name: /메지루시 악세사리 산리오 캐릭터즈 2.*배치/,
        pressed: true,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', {
        name: /#1697 메지루시 악세사리 산리오 캐릭터즈 2 보관 수량/,
      }),
    ).toHaveValue('5');
    expect(
      screen.getByRole('textbox', { name: /#1698 다른 가챠 보관 수량/ }),
    ).toHaveValue('2');
    expect(screen.getByRole('status')).toHaveTextContent(
      '서버 재고에는 반영되지 않습니다.',
    );
  });

  it('기존 초안 덮어쓰기를 취소하면 그대로 두고 같은 파일을 다시 선택할 수 있다', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    renderDraft();
    setGroupCount('4', '2');
    const file = csvFile(importFixture());

    uploadCsv(file);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'CSV 불러오기를 취소했습니다.',
      ),
    );
    expect(groupButton('4')).toHaveTextContent('2대 중 0대 배치');
    expect(screen.getByLabelText(/매장 공통 코인 단가/)).toHaveValue('1000');
    expect(screen.getByLabelText(/초안 CSV 파일 선택/)).toHaveValue('');

    confirm.mockReturnValue(true);
    uploadCsv(file);
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent(
        'CSV 초안을 불러왔습니다.',
      ),
    );
    expect(confirm).toHaveBeenCalledTimes(2);
    expect(groupButton('4')).toHaveTextContent('1대 중 1대 배치');
  });

  it('깨진 CSV나 다른 매장 CSV는 거부하고 현재 초안을 유지한다', async () => {
    const confirm = vi.spyOn(window, 'confirm');
    renderDraft();
    setGroupCount('4', '2');

    uploadCsv(csvFile('레코드 종류,매장 ID\n기기,3'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'CSV 양식의 첫 줄이 맞지 않습니다.',
      ),
    );
    expect(groupButton('4')).toHaveTextContent('2대 중 0대 배치');

    uploadCsv(csvFile(importFixture(4)));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        '다른 매장의 CSV입니다.',
      ),
    );
    expect(groupButton('4')).toHaveTextContent('2대 중 0대 배치');
    expect(screen.getByLabelText(/매장 공통 코인 단가/)).toHaveValue('1000');
    expect(confirm).not.toHaveBeenCalled();
  });

  it('CSV를 읽는 도중 매장을 바꾸면 이전 매장 파일을 적용하지 않는다', async () => {
    let resolveRead: ((buffer: ArrayBuffer) => void) | undefined;
    const csv = importFixture();
    const file = csvFile(csv);
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn().mockImplementation(
        () =>
          new Promise<ArrayBuffer>((resolve) => {
            resolveRead = resolve;
          }),
      ),
    });
    const view = renderDraft();
    uploadCsv(file);
    expect(screen.getByRole('status')).toHaveTextContent(
      'CSV 초안을 확인하는 중입니다.',
    );

    view.rerender(
      <MachinePlacementDraft
        gachas={gachas}
        machineCount={2}
        storeCoinPrice={800}
        storeId={4}
        storeName="홍대점"
      />,
    );
    await act(async () => {
      resolveRead?.(new TextEncoder().encode(csv).buffer);
    });
    expect(screen.getByLabelText(/매장 공통 코인 단가/)).toHaveValue('800');
    expect(groupButton('4')).toHaveTextContent('0대 중 0대 배치');
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(screen.getByLabelText(/초안 CSV 파일 선택/)).not.toBeDisabled();
  });

  it('CSV를 읽는 동안 작성한 기기 초안은 확인 없이 덮어쓰지 않는다', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
    let resolveRead: ((buffer: ArrayBuffer) => void) | undefined;
    const csv = importFixture();
    const file = csvFile(csv);
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn().mockImplementation(
        () =>
          new Promise<ArrayBuffer>((resolve) => {
            resolveRead = resolve;
          }),
      ),
    });
    renderDraft();
    uploadCsv(file);
    setGroupCount('4', '2');

    await act(async () => {
      resolveRead?.(new TextEncoder().encode(csv).buffer);
    });
    expect(confirm).toHaveBeenCalledOnce();
    expect(groupButton('4')).toHaveTextContent('2대 중 0대 배치');
    expect(screen.getByRole('status')).toHaveTextContent(
      'CSV 불러오기를 취소했습니다.',
    );
  });

  it('업로드 도중 화면을 벗어나면 나중에 확인창을 띄우지 않는다', async () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    let resolveRead: ((buffer: ArrayBuffer) => void) | undefined;
    const csv = importFixture();
    const file = csvFile(csv);
    Object.defineProperty(file, 'arrayBuffer', {
      value: vi.fn().mockImplementation(
        () =>
          new Promise<ArrayBuffer>((resolve) => {
            resolveRead = resolve;
          }),
      ),
    });
    const view = renderDraft();
    setGroupCount('4', '1');
    uploadCsv(file);
    view.unmount();

    await act(async () => {
      resolveRead?.(new TextEncoder().encode(csv).buffer);
    });
    expect(confirm).not.toHaveBeenCalled();
  });
});
