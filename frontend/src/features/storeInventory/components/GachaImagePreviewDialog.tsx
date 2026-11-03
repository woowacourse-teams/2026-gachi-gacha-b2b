import { useEffect, useRef, useState } from 'react';

import {
  ImagePreviewCloseButton,
  ImagePreviewFallback,
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
  onImageError?: () => void;
}

export default function GachaImagePreviewDialog({
  gachaId,
  imageUrl,
  name,
  onClose,
  onImageError,
}: GachaImagePreviewDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [imageFailed, setImageFailed] = useState(false);

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
        {imageFailed ? (
          <ImagePreviewFallback role="status">
            이미지를 불러오지 못했습니다. 원본 이미지 URL을 확인해 주세요.
          </ImagePreviewFallback>
        ) : (
          <ImagePreviewImage
            alt={`${name} 확대 이미지`}
            src={imageUrl}
            onError={() => {
              setImageFailed(true);
              onImageError?.();
            }}
          />
        )}
      </ImagePreviewPanel>
    </ImagePreviewOverlay>
  );
}
