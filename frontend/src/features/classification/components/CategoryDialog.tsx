import { useEffect, useRef, useState } from 'react';

import {
  DialogActions,
  DialogButton,
  DialogError,
  DialogPanel,
  FieldLabel,
  Overlay,
} from '@/components/Modal.styles';
import { getErrorMessage } from '@/utils/getErrorMessage';

import { isDuplicateCategory } from '../model/category';
import type { Category } from '../model/classification';

interface CategoryDialogProps {
  categories: Category[];
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
}

export default function CategoryDialog({
  categories,
  onClose,
  onCreate,
}: CategoryDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleSubmit = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('카테고리 이름을 입력해 주세요.');
      return;
    }

    if (isDuplicateCategory(categories, trimmedName)) {
      setError('이미 존재하는 카테고리입니다.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onCreate(trimmedName);
      onClose();
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Overlay
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <DialogPanel
        aria-labelledby="category-dialog-title"
        aria-modal="true"
        role="dialog"
      >
        <h2 id="category-dialog-title">카테고리 추가</h2>
        <p>추가한 카테고리는 모든 관리자가 공통으로 사용합니다.</p>
        <FieldLabel>
          카테고리 이름
          <input
            ref={inputRef}
            maxLength={30}
            placeholder="예: 포켓몬"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') void handleSubmit();
            }}
          />
        </FieldLabel>
        {error && <DialogError role="alert">{error}</DialogError>}
        <DialogActions>
          <DialogButton type="button" onClick={onClose}>
            취소
          </DialogButton>
          <DialogButton
            disabled={isSubmitting}
            kind="primary"
            type="button"
            onClick={() => void handleSubmit()}
          >
            {isSubmitting ? '추가 중...' : '추가'}
          </DialogButton>
        </DialogActions>
      </DialogPanel>
    </Overlay>
  );
}
