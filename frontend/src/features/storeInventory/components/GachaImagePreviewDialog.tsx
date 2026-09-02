import { useEffect, useRef } from 'react';

import {
  ImagePreviewCloseButton,
  ImagePreviewHeader,
  ImagePreviewImage,
  ImagePreviewOverlay,
  ImagePreviewPanel,
} from '../pages/StoreInventory.styles';

interface GachaImagePreviewDialogProps {
  gachaId: number;
  imageUrl: string;
  name: string;
  onClose: () => void;
}

export default function GachaImagePreviewDialog({
  gachaId,
  imageUrl,
  name,
  onClose,
}: GachaImagePreviewDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocusedElement =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);

    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = previousOverflow;
      previouslyFocusedElement?.focus();
    };
  }, [onClose]);

  return (
    <ImagePreviewOverlay
      role="presentation"
      onMouseDown={(event) => event.target === event.currentTarget && onClose()}
    >
      <ImagePreviewPanel
        aria-labelledby="gacha-image-preview-title"
        aria-modal="true"
        role="dialog"
      >
        <ImagePreviewHeader>
          <div>
            <small>DB ID #{gachaId}</small>
            <h2 id="gacha-image-preview-title">{name}</h2>
          </div>
          <ImagePreviewCloseButton
            ref={closeButtonRef}
            aria-label="확대 이미지 닫기"
            type="button"
            onClick={onClose}
          >
            ×
          </ImagePreviewCloseButton>
        </ImagePreviewHeader>
        <ImagePreviewImage alt={`${name} 확대 이미지`} src={imageUrl} />
      </ImagePreviewPanel>
    </ImagePreviewOverlay>
  );
}
