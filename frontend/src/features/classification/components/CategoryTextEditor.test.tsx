import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import CategoryTextEditor from './CategoryTextEditor';

const categories = [
  { id: 1, name: '산리오' },
  { id: 2, name: '피규어' },
];

afterEach(cleanup);

const renderEditor = () => {
  const onManage = vi.fn();
  const onToggle = vi.fn();

  render(
    <CategoryTextEditor
      aiError=""
      aiEnabled
      aiCharacterNames={['마이멜로디']}
      aiModel="mock-ai"
      aiStatus="READY"
      aiWorkNames={['산리오 캐릭터즈']}
      categories={categories}
      selectedCategoryIds={[1]}
      unknownCategoryNames={[]}
      value="산리오"
      onChange={vi.fn()}
      onManage={onManage}
      onRetry={vi.fn()}
      onToggle={onToggle}
    />,
  );

  return { onManage, onToggle };
};

describe('CategoryTextEditor', () => {
  it('등록된 카테고리를 선택 상태와 함께 표시하고 원클릭으로 전환한다', () => {
    const { onToggle } = renderEditor();

    expect(screen.getByRole('button', { name: '✓ 산리오' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    fireEvent.click(screen.getByRole('button', { name: '피규어' }));

    expect(onToggle).toHaveBeenCalledWith(categories[1]);
  });

  it('빠른 선택 목록 마지막에서 카테고리 추가를 연다', () => {
    const { onManage } = renderEditor();

    fireEvent.click(screen.getByRole('button', { name: '+ 카테고리 추가' }));

    expect(onManage).toHaveBeenCalledOnce();
  });
});
