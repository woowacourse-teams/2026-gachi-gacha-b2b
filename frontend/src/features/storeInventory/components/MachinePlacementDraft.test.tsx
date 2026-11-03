import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import MachinePlacementDraft, {
  type DraftGacha,
} from './MachinePlacementDraft';

const gachas: DraftGacha[] = [
  {
    id: 1697,
    name: '메지루시 악세사리 산리오 캐릭터즈 2',
    nameJa: 'めじるしアクセサリー',
  },
  { id: 1698, name: '다른 가챠' },
];

const props = {
  storeId: 3,
  storeName: '연남점',
  machineCount: 12,
  gachas,
};

const createObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
  URL,
  'createObjectURL',
);
const revokeObjectUrlDescriptor = Object.getOwnPropertyDescriptor(
  URL,
  'revokeObjectURL',
);

beforeEach(() => {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn(() => 'blob:machine-placement-draft'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  if (createObjectUrlDescriptor) {
    Object.defineProperty(URL, 'createObjectURL', createObjectUrlDescriptor);
  } else {
    Reflect.deleteProperty(URL, 'createObjectURL');
  }
  if (revokeObjectUrlDescriptor) {
    Object.defineProperty(URL, 'revokeObjectURL', revokeObjectUrlDescriptor);
  } else {
    Reflect.deleteProperty(URL, 'revokeObjectURL');
  }
});

describe('MachinePlacementDraft', () => {
  it('서버 저장 없는 초안임을 알리고 미완성 배치의 다운로드를 막는다', () => {
    render(<MachinePlacementDraft {...props} />);

    expect(
      screen.getByText(/새로고침하거나 화면을 떠나면 사라집니다/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/매장 정보에 적힌 기계 수는 12대/),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: '배치 초안 CSV 내려받기' }),
    );
    expect(screen.getByRole('alert')).toHaveTextContent(
      '기기 배치를 입력하거나 보관 품목을 추가',
    );
    expect(screen.getByLabelText(/기기 코드/)).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('매장 등록 가챠와 유효한 기기 메모를 CSV로 내려받는다', () => {
    render(<MachinePlacementDraft {...props} />);

    fireEvent.change(screen.getByLabelText(/기기 코드/), {
      target: { value: 'A-01' },
    });
    fireEvent.change(screen.getByLabelText(/매장 내 구역/), {
      target: { value: '입구' },
    });
    fireEvent.change(screen.getByLabelText(/설치 단/), {
      target: { value: '2' },
    });
    fireEvent.change(screen.getByLabelText(/코인 단가/), {
      target: { value: '1500' },
    });
    fireEvent.change(screen.getByLabelText(/회당 코인 수/), {
      target: { value: '12' },
    });
    fireEvent.change(screen.getByLabelText(/연결된 가챠/), {
      target: { value: '1697' },
    });
    fireEvent.change(screen.getByLabelText(/기기 내 확인 수량/), {
      target: { value: '5' },
    });
    expect(
      screen.getByText('회당 가격 18,000원 (자동 계산)'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: '배치 초안 CSV 내려받기' }),
    );

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(HTMLAnchorElement.prototype.click).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent(
      '사이트나 소비자 화면에는 반영되지',
    );
  });

  it('쌓인 단이 달라도 중복 기기 코드와 음수 수량을 오류로 표시한다', () => {
    render(<MachinePlacementDraft {...props} />);

    fireEvent.change(screen.getByLabelText(/기기 코드/), {
      target: { value: 'A-01' },
    });
    fireEvent.change(screen.getByLabelText(/연결된 가챠/), {
      target: { value: '1697' },
    });
    fireEvent.change(screen.getByLabelText(/기기 내 확인 수량/), {
      target: { value: '-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: '+ 배치 행 추가' }));
    const codes = screen.getAllByLabelText(/기기 코드/);
    const gachas = screen.getAllByLabelText(/연결된 가챠/);
    const tiers = screen.getAllByLabelText(/설치 단/);
    fireEvent.change(codes[1]!, { target: { value: 'a-01' } });
    fireEvent.change(tiers[1]!, { target: { value: '2' } });
    fireEvent.change(gachas[1]!, { target: { value: '1698' } });
    fireEvent.click(
      screen.getByRole('button', { name: '배치 초안 CSV 내려받기' }),
    );

    expect(screen.getAllByText(/기기 코드가 중복됩니다/)).toHaveLength(2);
    expect(
      screen.getByText(/기기 내 확인 수량은 0 이상의 정수/),
    ).toBeInTheDocument();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('코인 수를 모르면 가격 미확인으로 두고 잘못된 단가는 다운로드를 막는다', () => {
    render(<MachinePlacementDraft {...props} />);

    expect(screen.getByText(/회당 가격 미확인/)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/기기 코드/), {
      target: { value: 'A-01' },
    });
    fireEvent.change(screen.getByLabelText(/연결된 가챠/), {
      target: { value: '1697' },
    });
    fireEvent.change(screen.getByLabelText(/회당 코인 수/), {
      target: { value: '8' },
    });
    expect(
      screen.getByText('회당 가격 8,000원 (자동 계산)'),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText(/코인 단가/), {
      target: { value: '0' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: '배치 초안 CSV 내려받기' }),
    );

    expect(screen.getByText(/코인 단가는 1원 이상의 정수/)).toBeInTheDocument();
    expect(URL.createObjectURL).not.toHaveBeenCalled();
  });

  it('매장이 바뀌면 메모리 초안을 초기화한다', () => {
    const { rerender } = render(<MachinePlacementDraft {...props} />);
    fireEvent.change(screen.getByLabelText(/기기 코드/), {
      target: { value: 'A-01' },
    });

    rerender(
      <MachinePlacementDraft {...props} storeId={4} storeName="홍대점" />,
    );
    expect(screen.getByLabelText(/기기 코드/)).toHaveValue('');
    expect(
      screen.getByText(/매장 정보에 적힌 기계 수는 12대/),
    ).toBeInTheDocument();
  });

  it('연결된 가챠가 없으면 다운로드를 비활성화한다', () => {
    render(<MachinePlacementDraft {...props} gachas={[]} />);

    expect(
      screen.getByRole('button', { name: '배치 초안 CSV 내려받기' }),
    ).toBeDisabled();
    expect(
      screen.getByText(/이 매장에 등록된 가챠가 없어/),
    ).toBeInTheDocument();
  });

  it('기기 배치 전에 입고한 가챠의 보관 수량만 별도 입력할 수 있다', () => {
    render(<MachinePlacementDraft {...props} />);

    fireEvent.change(screen.getByLabelText('기기 배치 없이 보관할 가챠'), {
      target: { value: '1697' },
    });
    fireEvent.click(screen.getByRole('button', { name: '보관 품목 추가' }));
    fireEvent.change(screen.getByLabelText(/1697.*보관 수량/), {
      target: { value: '24' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: '배치 초안 CSV 내려받기' }),
    );

    expect(URL.createObjectURL).toHaveBeenCalledOnce();
    expect(screen.getByRole('status')).toHaveTextContent('초안 CSV');
  });

  it('같은 가챠를 여러 기기에 배치해도 보관 수량 입력칸은 하나다', () => {
    render(<MachinePlacementDraft {...props} />);

    fireEvent.change(screen.getByLabelText(/연결된 가챠/), {
      target: { value: '1697' },
    });
    fireEvent.click(screen.getByRole('button', { name: '+ 배치 행 추가' }));
    fireEvent.change(screen.getAllByLabelText(/연결된 가챠/)[1]!, {
      target: { value: '1697' },
    });

    expect(screen.getAllByLabelText(/1697.*보관 수량/)).toHaveLength(1);
  });
});
