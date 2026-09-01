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

import {
  CategoryList,
  CategoryRow,
  CategorySection,
  ConfirmActions,
  DeleteButton,
  DeleteConfirm,
} from './CategoryDialog.styles';
import { isDuplicateCategory } from '../model/category';
import type { Category } from '../model/classification';

interface CategoryDialogProps {
  categories: Category[];
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  onDelete: (categoryId: number) => Promise<void>;
}

export default function CategoryDialog({
  categories,
  onClose,
  onCreate,
  onDelete,
}: CategoryDialogProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;

      if (categoryToDelete) {
        setCategoryToDelete(null);
        return;
      }

      onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [categoryToDelete, onClose]);

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

  const handleDelete = async () => {
    if (!categoryToDelete) return;

    setDeletingId(categoryToDelete.id);
    setError('');

    try {
      await onDelete(categoryToDelete.id);
      setCategoryToDelete(null);
    } catch (cause) {
      setError(getErrorMessage(cause));
    } finally {
      setDeletingId(null);
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
        <h2 id="category-dialog-title">카테고리 관리</h2>
        <p>추가하거나 삭제한 카테고리는 모든 관리자가 공통으로 사용합니다.</p>
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
        <CategorySection>
          <h3>등록된 카테고리 {categories.length}개</h3>
          <CategoryList>
            {categories.map((category) => (
              <CategoryRow key={category.id}>
                <span>{category.name}</span>
                <DeleteButton
                  disabled={deletingId !== null}
                  type="button"
                  onClick={() => {
                    setCategoryToDelete(category);
                    setError('');
                  }}
                >
                  삭제
                </DeleteButton>
              </CategoryRow>
            ))}
          </CategoryList>
        </CategorySection>
        {categoryToDelete && (
          <DeleteConfirm role="alertdialog" aria-label="카테고리 삭제 확인">
            <p>
              <strong>{categoryToDelete.name}</strong> 카테고리를 삭제할까요?
              연결된 가챠에서도 이 카테고리가 제거됩니다.
            </p>
            <ConfirmActions>
              <button type="button" onClick={() => setCategoryToDelete(null)}>
                취소
              </button>
              <button
                disabled={deletingId !== null}
                type="button"
                onClick={() => void handleDelete()}
              >
                {deletingId === categoryToDelete.id
                  ? '삭제 중...'
                  : '삭제 확인'}
              </button>
            </ConfirmActions>
          </DeleteConfirm>
        )}
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
            {isSubmitting ? '추가 중...' : '카테고리 추가'}
          </DialogButton>
        </DialogActions>
      </DialogPanel>
    </Overlay>
  );
}
