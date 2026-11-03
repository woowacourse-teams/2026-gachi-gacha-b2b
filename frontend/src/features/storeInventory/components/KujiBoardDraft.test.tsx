import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { createKujiBoardDraftCsv, KujiBoardDraft } from './KujiBoardDraft';

afterEach(cleanup);

const getAt = (elements: HTMLElement[], index: number): HTMLElement => {
  const element = elements[index];
  if (!element) throw new Error(`입력 ${index + 1}이 없습니다.`);
  return element;
};

const fillBoard = () => {
  fireEvent.change(screen.getByRole('textbox', { name: '한국어 제목' }), {
    target: { value: '테스트 쿠지' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: '상자·로트 코드' }), {
    target: { value: 'BOX-01' },
  });
  fireEvent.change(screen.getByRole('textbox', { name: '1회 가격 (원)' }), {
    target: { value: '10000' },
  });
};

const fillGrade = (
  index: number,
  label: string,
  initial: string,
  remaining: string,
) => {
  fireEvent.change(getAt(screen.getAllByLabelText('등급 이름'), index), {
    target: { value: label },
  });
  fireEvent.change(getAt(screen.getAllByLabelText('초기 장수'), index), {
    target: { value: initial },
  });
  fireEvent.change(getAt(screen.getAllByLabelText('남은 장수'), index), {
    target: { value: remaining },
  });
};

describe('쿠지 현황판 시안', () => {
  it('가짜 재고 없이 빈 초안에서 시작하고 저장·공개되지 않는 상태를 명시한다', () => {
    render(<KujiBoardDraft storeId={7} storeName="연남 가챠점" />);

    expect(screen.getByText('빈 초안 · 서버 미저장')).toBeInTheDocument();
    expect(
      screen.getByText(
        /서버 저장·기기 간 공유·실시간 갱신·소비자 공개는 지원하지 않습니다/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '쿠지 제목 미입력' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: '한국어 제목' })).toHaveValue(
      '',
    );
    expect(screen.getByRole('textbox', { name: '초기 장수' })).toHaveValue('');
    expect(screen.getByRole('textbox', { name: '초기 장수' })).toHaveAttribute(
      'aria-invalid',
      'false',
    );
    expect(screen.getByText('입력 확인 필요')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '현재 초안 CSV 다운로드' }),
    ).toBeDisabled();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('등급별 장수와 라스트원을 편집하되 라스트원은 티켓 합계에 포함하지 않는다', () => {
    render(<KujiBoardDraft storeId={7} storeName="연남 가챠점" />);
    fillBoard();
    fillGrade(0, 'A', '2', '2');
    fireEvent.click(screen.getByRole('button', { name: '+ 등급 추가' }));
    fillGrade(1, 'B', '5', '4');
    fireEvent.click(screen.getByRole('button', { name: '+ 등급 추가' }));
    fillGrade(2, 'C', '20', '18');

    expect(screen.getByText('24 / 27장')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: '전체 티켓 잔여 비율' }),
    ).toHaveAttribute('aria-valuenow', '24');
    expect(
      screen.getByRole('button', { name: '현재 초안 CSV 다운로드' }),
    ).toBeEnabled();

    fireEvent.change(screen.getByRole('textbox', { name: /^라스트원 안내/ }), {
      target: { value: '별도 경품 두 개' },
    });
    expect(screen.getByText('24 / 27장')).toBeInTheDocument();
    expect(
      within(
        screen.getByRole('region', { name: '쿠지 현황판 미리보기' }),
      ).getByText('별도 경품 두 개'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '+ 등급 추가' }));
    expect(screen.getByText('입력 확인 필요')).toBeInTheDocument();
    fillGrade(3, '특상', '10', '3');

    expect(screen.getByText('27 / 37장')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: '전체 티켓 잔여 비율' }),
    ).toHaveAttribute('aria-valuemax', '37');

    fireEvent.change(getAt(screen.getAllByLabelText('남은 장수'), 3), {
      target: { value: '11' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent(
      '남은 장수는 초기 장수보다 클 수 없습니다.',
    );
    expect(screen.getByText('입력 확인 필요')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '현재 초안 CSV 다운로드' }),
    ).toBeDisabled();

    fireEvent.change(getAt(screen.getAllByLabelText('남은 장수'), 3), {
      target: { value: '3' },
    });
    expect(screen.getByText('27 / 37장')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '등급 4 삭제' }));
    expect(screen.getByText('24 / 27장')).toBeInTheDocument();
  }, 20_000);

  it('중복 등급과 소수 장수를 거부하고 제목을 한·일 별도로 편집한다', () => {
    render(<KujiBoardDraft storeId={7} storeName="연남 가챠점" />);
    fillGrade(0, 'A', '2', '2');
    fireEvent.click(screen.getByRole('button', { name: '+ 등급 추가' }));
    fillGrade(1, 'B', '1', '1');

    fireEvent.change(screen.getByRole('textbox', { name: '한국어 제목' }), {
      target: { value: '한국어 이름' },
    });
    fireEvent.change(screen.getByRole('textbox', { name: '일본어 제목' }), {
      target: { value: '日本語名' },
    });
    expect(
      screen.getByRole('heading', { name: '한국어 이름' }),
    ).toBeInTheDocument();
    expect(screen.getByText('日本語名')).toHaveAttribute('lang', 'ja');

    fireEvent.change(getAt(screen.getAllByLabelText('등급 이름'), 1), {
      target: { value: 'Ａ' },
    });
    expect(screen.getAllByRole('alert')[0]).toHaveTextContent(
      '같은 이름의 등급',
    );
    expect(screen.getByText('입력 확인 필요')).toBeInTheDocument();

    fireEvent.change(getAt(screen.getAllByLabelText('등급 이름'), 1), {
      target: { value: 'B' },
    });
    fireEvent.change(getAt(screen.getAllByLabelText('초기 장수'), 0), {
      target: { value: '1.5' },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('0 이상의 정수');
    expect(screen.getByText('입력 확인 필요')).toBeInTheDocument();
  });

  it('합계가 안전한 정수 범위를 넘으면 미리보기와 CSV를 막는다', () => {
    render(<KujiBoardDraft storeId={7} storeName="연남 가챠점" />);
    fillBoard();
    fillGrade(0, 'A', String(Number.MAX_SAFE_INTEGER), '1');
    fireEvent.click(screen.getByRole('button', { name: '+ 등급 추가' }));
    fillGrade(1, 'B', '1', '1');

    expect(screen.getByRole('alert')).toHaveTextContent(
      '전체 초기·남은 티켓 합계가 너무 큽니다.',
    );
    expect(screen.getByText('입력 확인 필요')).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '현재 초안 CSV 다운로드' }),
    ).toBeDisabled();

    fireEvent.change(getAt(screen.getAllByLabelText('초기 장수'), 0), {
      target: { value: String(Number.MAX_SAFE_INTEGER - 1) },
    });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '현재 초안 CSV 다운로드' }),
    ).toBeEnabled();
  });

  it('CSV 생성 함수도 빈 양식·합계 초과·0장 상자를 거부한다', () => {
    const draft = {
      nameKo: '테스트 쿠지',
      nameJa: '',
      boxCode: 'BOX-01',
      price: '10000',
      lastOne: '',
      grades: [
        { id: 1, label: 'A', prizeName: '', initial: '2', remaining: '1' },
      ],
    };
    expect(() =>
      createKujiBoardDraftCsv(7, '연남점', { ...draft, nameKo: '' }),
    ).toThrow('확인해 주세요');
    expect(() =>
      createKujiBoardDraftCsv(7, '연남점', {
        ...draft,
        grades: [
          { id: 1, label: 'A', prizeName: '', initial: '0', remaining: '0' },
        ],
      }),
    ).toThrow('확인해 주세요');
    expect(() =>
      createKujiBoardDraftCsv(7, '연남점', {
        ...draft,
        grades: [
          {
            id: 1,
            label: 'A',
            prizeName: '',
            initial: String(Number.MAX_SAFE_INTEGER),
            remaining: '1',
          },
          { id: 2, label: 'B', prizeName: '', initial: '1', remaining: '1' },
        ],
      }),
    ).toThrow('확인해 주세요');
  });

  it('유효한 초안 CSV에 한·일 제목과 등급별 장수를 보존하고 수식 삽입을 방어한다', () => {
    const csv = createKujiBoardDraftCsv(
      7,
      '=HYPERLINK("https://example.com")',
      {
        nameKo: '테스트 쿠지',
        nameJa: 'テストくじ',
        boxCode: 'BOX-02',
        price: '16000',
        lastOne: '마지막 티켓 구매 시 제공',
        grades: [
          {
            id: 1,
            label: '특상',
            prizeName: '피규어',
            initial: '2',
            remaining: '1',
          },
        ],
      },
    );

    expect(csv).toMatch(/^\uFEFF"자료 성격","매장 ID"/u);
    expect(csv).toContain('"\'=HYPERLINK(""https://example.com"")"');
    expect(csv).toContain(
      '"테스트 쿠지","テストくじ","BOX-02","16000","특상","피규어","2","1"',
    );
    expect(csv).toContain('"마지막 티켓 구매 시 제공"');
    expect(csv).toContain('"브라우저 임시 초안 · 서버 미저장"');
    expect(csv).toMatch(/\r\n$/u);
  });
});
