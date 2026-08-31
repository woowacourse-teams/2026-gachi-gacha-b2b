import { useEffect, useRef, useState } from 'react';

import {
  DialogActions,
  DialogButton,
  DialogError,
  DialogPanel,
  FieldLabel,
  Overlay,
} from '@/components/Modal.styles';

interface SkipDialogProps {
  itemName: string;
  isSubmitting: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export default function SkipDialog({
  itemName,
  isSubmitting,
  error,
  onClose,
  onConfirm,
}: SkipDialogProps) {
  const [reason, setReason] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    inputRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isSubmitting, onClose]);

  return (
    <Overlay
      role="presentation"
      onMouseDown={(event) =>
        event.target === event.currentTarget && !isSubmitting && onClose()
      }
    >
      <DialogPanel
        aria-labelledby="skip-dialog-title"
        aria-modal="true"
        role="dialog"
      >
        <h2 id="skip-dialog-title">이 데이터를 건너뛸까요?</h2>
        <p>
          <strong>{itemName || '이름 미정 데이터'}</strong>는 삭제하지 않고
          건너뛴 데이터 목록으로 이동합니다. 나중에 다시 복구할 수 있습니다.
        </p>
        <FieldLabel>
          건너뛰는 이유
          <textarea
            ref={inputRef}
            maxLength={200}
            placeholder="예: 중복 이미지, 가챠와 무관한 이미지"
            rows={3}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </FieldLabel>
        {error && <DialogError role="alert">{error}</DialogError>}
        <DialogActions>
          <DialogButton disabled={isSubmitting} type="button" onClick={onClose}>
            계속 분류하기
          </DialogButton>
          <DialogButton
            disabled={!reason.trim() || isSubmitting}
            kind="danger"
            type="button"
            onClick={() => onConfirm(reason)}
          >
            {isSubmitting ? '처리 중...' : '건너뛰기 확인'}
          </DialogButton>
        </DialogActions>
      </DialogPanel>
    </Overlay>
  );
}
